"""Application-owned paths and atomic, private JSON persistence."""

import json
import os
import tempfile
from pathlib import Path
from typing import Any


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
        self.model_root = self.root / "models"
        for directory in (self.outputs, self.voices, self.previews, self.temporary, self.logs):
            directory.mkdir(parents=True, exist_ok=True)
        self.saved = read_json(self.state_file, {})
        if self.saved.get("cachePath"):
            self.model_root = Path(self.saved["cachePath"]).resolve()
        self.model_root.mkdir(parents=True, exist_ok=True)

    def save(self, value: dict) -> None:
        self.saved = value
        write_json(self.state_file, value)


def selected_file(raw: str, extensions: set[str], limit: int = 10_000_000) -> Path:
    path = Path(raw).resolve(strict=True)
    if not path.is_file() or path.suffix.lower() not in extensions:
        raise ValueError("Choose a supported file.")
    if path.stat().st_size > limit:
        raise ValueError("That file is too large.")
    return path
