"""Application-owned paths and atomic, private JSON persistence."""

import json
import logging
import os
import re
import shutil
import sys
import tempfile
from collections.abc import Callable
from pathlib import Path
from typing import Annotated, Any, BinaryIO, Literal

from pydantic import AfterValidator, Field, ValidationError

from .contract import DEVICE_MODES, MAX_TEXT_LENGTH
from .schemas import Input, Settings

log = logging.getLogger(__name__)
REFERENCE_NAME = re.compile(r"reference-[0-9a-f]{32}\.wav")
RENDER_DIRECTORY = re.compile(r"\.render-[a-z0-9_]{8}")


def lock_workspace(root: Path) -> BinaryIO:
    """Hold exclusive ownership until the returned handle closes."""
    path = root / "engine.lock"
    if path.is_symlink():
        raise ValueError("The workspace lock must not be redirected by a link.")
    lock = path.open("a+b")
    try:
        if sys.platform == "win32":
            import msvcrt

            lock.seek(0)
            msvcrt.locking(lock.fileno(), msvcrt.LK_NBLCK, 1)
        else:
            import fcntl

            fcntl.flock(lock, fcntl.LOCK_EX | fcntl.LOCK_NB)
    except OSError as error:
        lock.close()
        raise OSError(
            "Could not lock the workspace. Another engine may already be using it."
        ) from error
    return lock


def validate_utf8(value: str) -> str:
    value.encode("utf-8")
    return value


Utf8Text = Annotated[str, AfterValidator(validate_utf8)]


class WorkspaceState(Input):
    version: Literal[1] = 1
    setupComplete: bool = False
    settings: Settings = Field(default_factory=Settings)
    savedSettings: Settings = Field(default_factory=Settings)
    script: str = Field(default="", max_length=MAX_TEXT_LENGTH)
    dictionary: str = Field(default="", max_length=MAX_TEXT_LENGTH)
    batchText: str = Field(default="", max_length=MAX_TEXT_LENGTH)
    cachePath: Utf8Text = ""
    device: str = "auto"


def migrate_settings(values: object) -> object:
    if isinstance(values, dict) and values.get("model") in ("nano", "original"):
        return {**values, "model": "auto"}
    return values


def recover_fields(schema: type[Input], data: dict) -> tuple[dict, bool]:
    try:
        return schema.model_validate(data).model_dump(exclude_unset=True), False
    except ValidationError as error:
        recovered = data.copy()
        for entry in error.errors():
            *parents, field = entry["loc"]
            current = recovered
            for parent in parents:
                current[parent] = current[parent].copy()
                current = current[parent]
            current.pop(field, None)
        return schema.model_validate(recovered).model_dump(exclude_unset=True), True


def normalize_workspace(data: object) -> tuple[dict, bool]:
    if not isinstance(data, dict):
        return {"version": 1}, True
    version = data.get("version", 1)
    if type(version) is not int or version != 1:
        raise ValueError("Unsupported workspace version.")
    data = data.copy()
    for key in ("settings", "savedSettings"):
        if key in data:
            data[key] = migrate_settings(data[key])
    invalid_device = "device" in data and data["device"] not in DEVICE_MODES
    if invalid_device:
        del data["device"]
    recovered, damaged = recover_fields(WorkspaceState, data)
    return {"version": 1, **recovered}, damaged or invalid_device


def prepare_model_root(path: Path, *, create: bool = True) -> Path:
    path = path.resolve()
    if create:
        path.mkdir(parents=True, exist_ok=True)
    if not path.is_dir():
        raise ValueError("The model folder is unavailable.")
    cache = path / "phonivra-model-cache"
    if cache.is_symlink():
        raise ValueError("The model cache must not be redirected by a link.")
    with tempfile.TemporaryFile(dir=cache if cache.exists() else path):
        pass
    return path


def read_json(path: Path, default: Any = None) -> Any:
    if not path.exists():
        return default
    return json.loads(path.read_text(encoding="utf-8"))


def write_json(path: Path, value: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    fd, temporary = tempfile.mkstemp(prefix=".phonivra-", dir=path.parent)
    try:
        with os.fdopen(fd, "w", encoding="utf-8") as file:
            json.dump(value, file, ensure_ascii=False, indent=2, allow_nan=False)
            file.flush()
            os.fsync(file.fileno())
        os.replace(temporary, path)
    finally:
        Path(temporary).unlink(missing_ok=True)


class Storage:
    def __init__(self, root: Path):
        self.root = root.resolve()
        self.outputs = self.root / "outputs"
        self.voices = self.root / "voices"
        self.previews = self.root / "previews"
        self.temporary = self.root / "temporary"
        self.logs = self.root / "logs"
        self.state_file = self.root / "workspace.json"
        self.recovery_warnings: list[str] = []
        self.blocked_documents: set[Path] = set()
        for directory in (self.outputs, self.voices, self.previews, self.temporary, self.logs):
            directory.mkdir(parents=True, exist_ok=True)
        self.saved = self.load_document(self.state_file, normalize_workspace)
        self.model_root = self.load_model_root()

    def cleanup_stale_audio(self, checkpoint: Callable[[], None]) -> None:
        """Remove abandoned app artifacts while the engine owns the workspace lock."""
        for directory in (self.temporary, self.outputs, self.previews):
            try:
                if directory.resolve() != directory:
                    continue
                for path in directory.iterdir():
                    checkpoint()
                    try:
                        if path.is_symlink():
                            continue
                        if directory == self.temporary:
                            if (
                                path.name == "microphone.wav" or REFERENCE_NAME.fullmatch(path.name)
                            ) and path.is_file():
                                path.unlink(missing_ok=True)
                        elif (
                            RENDER_DIRECTORY.fullmatch(path.name)
                            and path.is_dir()
                            and path.resolve() == path
                        ):
                            shutil.rmtree(path)
                    except OSError:
                        log.warning("Could not remove stale audio artifact %s.", path.name)
            except OSError:
                log.warning("Could not check %s for stale audio.", directory.name)

    def warn(self, message: str) -> None:
        if message not in self.recovery_warnings:
            self.recovery_warnings.append(message)
            log.warning("%s", message)

    def load_model_root(self) -> Path:
        saved_path = self.saved.get("cachePath")
        default = self.root / "models"
        if saved_path:
            try:
                return prepare_model_root(Path(saved_path), create=False)
            except (OSError, ValueError, RuntimeError):
                self.warn(
                    "The saved model folder is unavailable. Using the default location for now. "
                    "You can choose a different model folder."
                )
        try:
            return prepare_model_root(default)
        except (OSError, ValueError, RuntimeError):
            self.warn("The default model folder is unavailable. Choose a writable model folder.")
            return default

    def load_document(self, path: Path, normalize: Callable[[object], tuple[dict, bool]]) -> dict:
        name = path.relative_to(self.root).as_posix()
        try:
            original = path.read_bytes()
        except FileNotFoundError:
            self.blocked_documents.discard(path)
            return {}
        except OSError:
            self.blocked_documents.add(path)
            self.warn(f"Could not read {name}. Saving it is paused until it can be read.")
            return {}

        repaired = True
        try:
            data, repaired = normalize(json.loads(original.decode("utf-8")))
        except (ValueError, RecursionError):
            data, _ = normalize({})
        if repaired:
            backup_path = None
            try:
                with tempfile.NamedTemporaryFile(
                    mode="wb",
                    prefix=f"{path.stem}.recovery-",
                    suffix=".json",
                    dir=path.parent,
                    delete=False,
                ) as backup:
                    backup_path = Path(backup.name)
                    backup.write(original)
                    backup.flush()
                    os.fsync(backup.fileno())
            except OSError:
                if backup_path is not None:
                    try:
                        backup_path.unlink()
                    except OSError:
                        log.warning("Could not remove an incomplete recovery copy of %s.", name)
                self.blocked_documents.add(path)
                self.warn(f"Could not back up {name}. The original was left in place.")
                return data
            saved_as = backup_path.relative_to(self.root).as_posix()
            self.warn(f"Recovered {name}. The original was saved as {saved_as}.")
            try:
                write_json(path, data)
            except OSError:
                self.blocked_documents.add(path)
                self.warn(f"Could not replace {name} on disk. The original was left in place.")
                return data
        self.blocked_documents.discard(path)
        return data

    def save_document(self, path: Path, value: dict) -> None:
        if path in self.blocked_documents:
            raise OSError(
                f"Could not safely save {path.name}. Check the file and restart Phonivra."
            )
        write_json(path, value)

    def save(self, value: dict) -> None:
        self.save_document(self.state_file, value)
        self.saved = value


def selected_file(raw: str, extensions: set[str], limit: int = 10_000_000) -> Path:
    path = Path(raw).resolve(strict=True)
    if not path.is_file() or path.suffix.lower() not in extensions:
        raise ValueError("Choose a supported file.")
    if path.stat().st_size > limit:
        raise ValueError("That file is too large.")
    return path
