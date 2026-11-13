"""Model-independent narration orchestration; no transport or desktop UI code."""

import logging
import random
import tempfile
import time
from contextlib import nullcontext
from datetime import UTC, datetime
from pathlib import Path
from uuid import uuid4

import numpy as np
import soundfile as sf

from . import audio
from .chatterbox_compat import clone_conditionals
from .contract import INDIC_LANGUAGES
from .directml import DirectMLError
from .jobs import Jobs
from .library import companions, filename
from .models import Models
from .schemas import Settings, resolve_model
from .text import prepare, split_chunks

log = logging.getLogger(__name__)


class Narrator:
    def __init__(self, models: Models, jobs: Jobs):
        self.models, self.jobs = models, jobs

    def generate(
        self,
        script: str,
        settings: Settings,
        dictionary: str,
        reference: Path | None,
        voice_label: str,
        directory: Path,
        transcript: str = "",
    ) -> dict:
        seed = settings.seed or random.SystemRandom().randint(1, 2147483647)
        try:
            return self._generate(
                script, settings, dictionary, reference, voice_label, directory, transcript, seed
            )
        except DirectMLError:
            log.exception("DirectML narration failed. Retrying on CPU.")
        self.jobs.checkpoint()
        self.jobs.progress("loading", 0, "DirectML failed. Retrying on CPU…")
        return self._generate(
            script,
            settings,
            dictionary,
            reference,
            voice_label,
            directory,
            transcript,
            seed,
            force_cpu=True,
        )

    def _generate(
        self,
        script: str,
        settings: Settings,
        dictionary: str,
        reference: Path | None,
        voice_label: str,
        directory: Path,
        transcript: str,
        seed: int,
        *,
        force_cpu: bool = False,
    ) -> dict:
        import torch

        model_id = resolve_model(settings)
        if model_id == "turbo" and settings.language != "en":
            raise ValueError(f"{model_id.title()} is English-only. Select Multilingual V3 or Auto.")
        if model_id == "indicf5":
            if settings.language not in INDIC_LANGUAGES:
                raise ValueError("Choose an IndicF5 language or switch to Auto.")
            if reference is None or not transcript.strip():
                raise ValueError("IndicF5 needs a saved voice preset with a reference transcript.")
        elif settings.language in INDIC_LANGUAGES - {"hi"}:
            raise ValueError("Choose IndicF5 or Auto for this language.")
        prepared = prepare(script, settings, dictionary)
        chunks = split_chunks(prepared, settings.chunk_limit, settings.gap)
        random.seed(seed)
        np.random.seed(seed)
        torch.manual_seed(seed)
        if torch.cuda.is_available():
            torch.cuda.manual_seed_all(seed)
        model = self.models.load(model_id, force_cpu=force_cpu)
        self.jobs.progress("preparing", 0, "Preparing voice reference…", total=len(chunks))
        with torch.inference_mode():
            prompt = None
            if model_id == "indicf5":
                prompt = model.prepare(reference, transcript)
            elif reference:
                model.prepare_conditionals(
                    str(reference),
                    exaggeration=settings.exaggeration if model_id != "turbo" else 0.5,
                )
            else:
                model.conds = clone_conditionals(self.models.default_conditionals)
            if model_id != "indicf5" and model.conds is None:
                raise ValueError(
                    "This model needs a reference. Upload or record at least 5 seconds of speech."
                )
            if model.device == "cuda" and model_id == "multilingual":
                self.models.half_conditionals(model)
            return self._render(
                model,
                model_id,
                prepared,
                chunks,
                settings,
                seed,
                voice_label,
                directory,
                len(script),
                prompt,
            )

    def _render(
        self,
        model,
        model_id,
        prepared,
        chunks,
        settings,
        seed,
        voice_label,
        directory,
        source_characters,
        prompt,
    ):
        rate = model.sr
        parts = []
        output_id = uuid4().hex
        name = f"{filename(settings.title)}-{output_id[:10]}.{settings.format}"
        destination = directory / name
        last_report = 0.0
        part_index = 0

        def check_token(_module, _inputs):
            nonlocal last_report
            self.jobs.checkpoint()
            if time.monotonic() - last_report >= 0.3:
                last_report = time.monotonic()
                self.jobs.progress(
                    "generating",
                    part_index / len(chunks) * 85,
                    f"Generating part {part_index + 1} of {len(chunks)}…",
                )

        hook = (
            nullcontext()
            if model_id == "indicf5"
            else model.t3.tfmr.register_forward_pre_hook(check_token)
        )
        with hook, tempfile.TemporaryDirectory(prefix=".render-", dir=directory) as temporary:
            staging = Path(temporary)
            raw = staging / "raw.wav"
            with sf.SoundFile(raw, "w", samplerate=rate, channels=1, subtype="FLOAT") as file:
                for index, chunk in enumerate(chunks):
                    part_index = index
                    self.jobs.progress(
                        "generating",
                        index / len(chunks) * 85,
                        f"Generating part {index + 1} of {len(chunks)}"
                        + (
                            " on CPU…"
                            if self.models.mode == "directml"
                            and self.models.active_backend == "cpu"
                            else "…"
                        ),
                        part=index + 1,
                    )
                    if chunk.text:
                        if model_id == "indicf5":
                            wav = model.generate(chunk.text, prompt, self.jobs)
                        else:
                            options = {
                                "temperature": settings.temperature,
                                "top_p": settings.top_p,
                                "repetition_penalty": settings.repetition_penalty,
                            }
                            if model_id == "turbo":
                                options["top_k"] = settings.top_k
                            else:
                                options.update(
                                    min_p=settings.min_p,
                                    exaggeration=settings.exaggeration,
                                    cfg_weight=settings.cfg_weight,
                                )
                                options["language_id"] = settings.language
                            wav = (
                                model.generate(chunk.text, **options)
                                .detach()
                                .cpu()
                                .numpy()
                                .reshape(-1)
                            )
                        self.jobs.checkpoint()
                        if not np.isfinite(wav).all() or not len(wav):
                            if self.models.active_backend == "directml":
                                raise DirectMLError("DirectML generation returned invalid audio.")
                            raise ValueError(
                                "The model returned invalid audio. Try different settings."
                            )
                        file.write(wav)
                        seconds = len(wav) / rate
                    else:
                        seconds = 0
                    if chunk.pause:
                        file.write(np.zeros(round(chunk.pause * rate), dtype=np.float32))
                    parts.append(
                        {
                            "id": f"part-{index + 1}",
                            "index": index + 1,
                            "text": chunk.text,
                            "duration": seconds,
                            "pause": chunk.pause,
                        }
                    )
            self.jobs.progress("mastering", 86, "Mastering audio…")
            mastered = staging / "master.wav"
            frames, rate, gain, trim = audio.master(raw, mastered, settings, self.jobs)
            self.jobs.progress("encoding", 90, f"Encoding {settings.format.upper()}…")
            encoded = staging / name
            audio.encode(mastered, encoded, settings, self.jobs)
            self.jobs.checkpoint()
            # Adjust chunk-derived subtitle times for leading trim and tempo.
            remaining_trim = trim
            for part in parts:
                removed = min(remaining_trim, part["duration"])
                part["duration"] = (part["duration"] - removed) / settings.speed
                remaining_trim -= removed
                removed_gap = min(remaining_trim, part["pause"])
                part["pause"] = (part["pause"] - removed_gap) / settings.speed
                remaining_trim -= removed_gap
            record = {
                "id": output_id,
                "title": settings.title or "Narration",
                "filename": name,
                "duration": frames / rate / settings.speed,
                "created": datetime.now(UTC).isoformat(),
                "format": settings.format,
                "sampleRate": settings.sample_rate,
                "language": settings.language,
                "model": model_id,
                "backend": self.models.active_backend,
                "voice": voice_label,
                "seed": seed,
                "loudnessGain": gain,
                "requestedModel": settings.model,
                "sourceCharacters": source_characters,
                "speed": settings.speed,
                "trimStart": trim,
                "settingsSnapshot": settings.model_dump(),
                "metadataAvailable": True,
                "external": False,
                "companions": ["srt", "vtt", "txt", "json"],
                "parts": parts,
            }
            self.jobs.progress("companions", 98, "Writing subtitles and metadata…")
            from .text import PAUSE

            companions(encoded, record, PAUSE.sub("", prepared).strip())
            self.jobs.checkpoint()
            # Audio is moved last; the library never sees a half-written generation.
            for extension in ("srt", "vtt", "txt", "json"):
                encoded.with_suffix(f".{extension}").replace(
                    destination.with_suffix(f".{extension}")
                )
            encoded.replace(destination)
            return record
