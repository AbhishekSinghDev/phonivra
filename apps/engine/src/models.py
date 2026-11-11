"""Pinned model assets, resumable downloads, and local-only checkpoint loading."""

import gc
import hashlib
import io
import json
from dataclasses import dataclass
from importlib.resources import files
from pathlib import Path

from .chatterbox_compat import configure_local_cangjie
from .jobs import Jobs
from .storage import write_json


@dataclass(frozen=True)
class ModelSpec:
    repository: str
    revision: str
    digests: dict[str, str]


SPECS = {
    model_id: ModelSpec(**spec)
    for model_id, spec in json.loads(
        files(__package__).joinpath("model-assets.json").read_text(encoding="utf-8")
    ).items()
}


class Models:
    def __init__(self, root: Path, jobs: Jobs):
        self.root, self.jobs = root, jobs
        self.token: str | None = None
        self.active: str | None = None
        self.model = None
        self.default_conditionals = None
        self.mode = "auto"

    def cache(self, model_id: str) -> Path:
        path = self.root / "phonivra-model-cache" / model_id
        if path.resolve() != path:
            raise ValueError("The model cache must not be redirected by a link.")
        return path

    def manifest(self, model_id: str) -> Path:
        return self.cache(model_id) / "installed.json"

    def snapshot_path(self, model_id: str) -> Path:
        spec = SPECS[model_id]
        repository = spec.repository.replace("/", "--")
        return self.cache(model_id) / f"models--{repository}" / "snapshots" / spec.revision

    @staticmethod
    def asset_is_local(asset: Path, digest: str) -> bool:
        blob = asset.parent.parent.parent / "blobs" / digest
        return asset.parent.resolve() == asset.parent and asset.resolve() in (asset, blob)

    def installed(self, model_id: str) -> Path | None:
        try:
            manifest = self.manifest(model_id)
            if manifest.is_symlink():
                return None
            spec = SPECS[model_id]
            if json.loads(manifest.read_text(encoding="utf-8")) != spec.revision:
                return None
            directory = self.snapshot_path(model_id)
            if directory.resolve() != directory:
                return None
            if {asset.name for asset in directory.iterdir()} != set(spec.digests):
                return None
            for name, digest in spec.digests.items():
                asset = directory / name
                if not self.asset_is_local(asset, digest) or not asset.is_file():
                    return None
            return directory
        except (OSError, ValueError, RuntimeError):
            return None

    def verify_asset(self, path: Path, digest: str) -> bool:
        checksum = hashlib.sha256() if len(digest) == 64 else hashlib.sha1(usedforsecurity=False)
        with path.open("rb") as file:
            if len(digest) == 40:
                checksum.update(f"blob {path.stat().st_size}\0".encode())
            while chunk := file.read(1024 * 1024):
                self.jobs.checkpoint()
                checksum.update(chunk)
        return checksum.hexdigest() == digest

    def catalog(self) -> list[dict]:
        result = []
        for model_id, spec in SPECS.items():
            directory = self.installed(model_id)
            downloading = self.jobs.busy and self.jobs.download_id == model_id
            status = "not-installed"
            if directory:
                status = "active" if self.active == model_id else "installed"
            if downloading:
                status = "paused" if not self.jobs.resumed.is_set() else "downloading"
            result.append(
                {
                    "id": model_id,
                    "status": status,
                    "bytes": sum((directory / f).stat().st_size for f in spec.digests)
                    if directory
                    else None,
                    "progress": 100 if directory else 0,
                }
            )
        return result

    def download(self, model_id: str) -> Path:
        from huggingface_hub import hf_hub_download
        from tqdm.auto import tqdm

        spec, jobs = SPECS[model_id], self.jobs
        cache = self.cache(model_id)
        destination = self.snapshot_path(model_id)
        endpoint = "https://huggingface.co"
        token = self.token or False
        jobs.download_id = model_id
        try:
            blobs = destination.parent.parent / "blobs"
            locks = cache / ".locks" / destination.parent.parent.name
            if any(path.resolve() != path for path in (destination, blobs, locks)):
                raise ValueError("The model snapshot must not be redirected by a link.")
            digests = spec.digests
            for name, digest in digests.items():
                for target in (
                    blobs / digest,
                    blobs / f"{digest}.incomplete",
                    locks / f"{digest}.lock",
                ):
                    if target.is_symlink():
                        raise ValueError("The model cache contains an unexpected link.")
                if not self.asset_is_local(destination / name, digest):
                    raise ValueError("The model cache contains an unexpected link.")
            for index, filename in enumerate(digests):
                jobs.progress("downloading", index / len(digests) * 100, f"Downloading {filename}")

                class Progress(tqdm):
                    def __init__(bar, *args, **kwargs):
                        kwargs["disable"] = False
                        kwargs["file"] = io.StringIO()
                        super().__init__(*args, **kwargs)
                        bar.last_report = 0.0

                    def update(bar, n=1, file_index=index, asset=filename):
                        jobs.checkpoint()
                        value = super().update(n)
                        import time

                        if time.monotonic() - bar.last_report > 0.2:
                            bar.last_report = time.monotonic()
                            fraction = bar.n / bar.total if bar.total else 0
                            jobs.progress(
                                "downloading",
                                (file_index + fraction) / len(digests) * 100,
                                f"Downloading {asset}: {bar.n / 1_000_000:.1f} MB",
                            )
                        return value

                    def close(bar):
                        super().close()
                        if getattr(bar, "fp", None):
                            bar.fp.close()

                for refresh in (False, True):
                    path = Path(
                        hf_hub_download(
                            spec.repository,
                            filename,
                            revision=spec.revision,
                            cache_dir=cache,
                            endpoint=endpoint,
                            token=token,
                            force_download=refresh,
                            tqdm_class=Progress,
                        )
                    )
                    if (
                        path == destination / filename
                        and self.asset_is_local(path, digests[filename])
                        and self.verify_asset(path, digests[filename])
                    ):
                        break
                else:
                    raise ValueError(f"Could not verify the downloaded asset {filename}.")
            if {asset.name for asset in destination.iterdir()} != set(digests):
                raise ValueError("The pinned model cache contains unrecognized files.")
            jobs.checkpoint()
            write_json(self.manifest(model_id), spec.revision)
            return destination
        finally:
            jobs.download_id = None

    def backend(self) -> str:
        import torch

        available = {"cuda": torch.cuda.is_available(), "mps": torch.backends.mps.is_available()}
        if self.mode == "auto":
            return next((name for name, ready in available.items() if ready), "cpu")
        return self.mode if available.get(self.mode) else "cpu"

    def device(self) -> dict:
        import torch

        backend = self.backend()
        labels = {"cpu": "CPU", "mps": "Apple Metal (MPS)"}
        return {
            "mode": self.mode,
            "label": torch.cuda.get_device_name(0) if backend == "cuda" else labels[backend],
            "vram": f"{torch.cuda.get_device_properties(0).total_memory / 1024**3:.1f} GB"
            if backend == "cuda"
            else None,
            "available": self.mode == "auto" or self.mode == backend,
        }

    def release(self) -> None:
        self.model = self.default_conditionals = self.active = None
        gc.collect()
        import torch

        if torch.cuda.is_available():
            torch.cuda.empty_cache()
        if torch.backends.mps.is_available():
            torch.mps.empty_cache()

    def load(self, model_id: str):
        if self.active == model_id and self.model is not None:
            return self.model
        directory = self.installed(model_id)
        if directory:
            digests = SPECS[model_id].digests
            self.jobs.progress("loading", 0, f"Verifying {model_id} assets…")
            if not all(
                self.verify_asset(directory / name, digest) for name, digest in digests.items()
            ):
                directory = self.download(model_id)
        else:
            directory = self.download(model_id)
        self.jobs.progress("loading", 0, f"Loading {model_id} from disk…")
        self.release()
        import huggingface_hub.constants as hub_constants

        device = self.backend()
        if self.mode not in ("auto", device):
            raise ValueError(f"{self.mode.upper()} is unavailable. Select CPU or Auto in Settings.")
        load_device = "cpu" if device == "cuda" else device
        previous_offline = hub_constants.HF_HUB_OFFLINE
        hub_constants.HF_HUB_OFFLINE = True
        try:
            if model_id in {"turbo", "nano"}:
                from chatterbox.tts_turbo import ChatterboxTurboTTS

                model = ChatterboxTurboTTS.from_local(directory, device, nano=model_id == "nano")
            elif model_id == "multilingual":
                from chatterbox.mtl_tts import ChatterboxMultilingualTTS

                model = ChatterboxMultilingualTTS.from_local(directory, load_device, t3_model="v3")
                configure_local_cangjie(model, directory)
            else:
                from chatterbox.tts import ChatterboxTTS

                model = ChatterboxTTS.from_local(directory, load_device)
            if device == "cuda" and model_id in {"multilingual", "original"}:
                model.t3.half().to(device)
                model.s3gen.to(device)
                model.ve.to(device)
                model.device = device
                if model.conds is not None:
                    model.conds.to(device)
                    self.half_conditionals(model)
            self.model, self.active = model, model_id
            self.default_conditionals = model.conds
            self.jobs.checkpoint()
            return model
        finally:
            hub_constants.HF_HUB_OFFLINE = previous_offline

    @staticmethod
    def half_conditionals(model) -> None:
        import torch

        if model.device == "cpu" or model.conds is None:
            return
        for key, value in vars(model.conds.t3).items():
            if torch.is_tensor(value) and value.is_floating_point():
                setattr(model.conds.t3, key, value.half())
        for key, value in model.conds.gen.items():
            if torch.is_tensor(value) and value.is_floating_point():
                model.conds.gen[key] = value.half()

    def remove(self, model_id: str) -> None:
        self.jobs.require_idle()
        if self.active == model_id:
            self.release()
        directory = self.snapshot_path(model_id)
        blobs = directory.parent.parent / "blobs"
        if directory.resolve() != directory or blobs.resolve() != blobs:
            raise ValueError("The model cache must not be redirected by a link.")
        self.manifest(model_id).unlink(missing_ok=True)
        for name, digest in SPECS[model_id].digests.items():
            (directory / name).unlink(missing_ok=True)
            (blobs / digest).unlink(missing_ok=True)
