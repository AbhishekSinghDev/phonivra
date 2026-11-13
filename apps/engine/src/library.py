"""Library sidecars, exports, and app-owned voice recordings."""

import hashlib
import logging
import re
import shutil
import zipfile
from datetime import UTC, datetime
from pathlib import Path
from uuid import uuid4

from . import audio
from .contract import AUDIO_EXTENSIONS
from .schemas import OutputRecord
from .storage import Storage, read_json, write_json

log = logging.getLogger(__name__)


def filename(title: str) -> str:
    return re.sub(r"[^\w.-]+", "-", title, flags=re.UNICODE).strip(".-")[:80] or "narration"


class Library:
    def __init__(self, storage: Storage):
        self.storage = storage
        self.records: dict[str, dict] = {}
        self.voice_transcripts: dict[str, str] = {}
        self.voice_paths: dict[str, Path] = {}
        self.preview_paths: dict[str, Path] = {}

    def refresh(self) -> list[dict]:
        records = {}
        for path in self.storage.outputs.iterdir():
            if path.suffix.lower() not in AUDIO_EXTENSIONS or path.is_symlink():
                continue
            try:
                data = read_json(path.with_suffix(".json"))
                if isinstance(data, dict) and data.get("phonivraVersion") == 1:
                    record = OutputRecord.model_validate(data["output"]).model_dump()
                    if record.get("filename") != path.name:
                        raise ValueError("Sidecar filename does not match audio.")
                else:
                    seconds, rate = audio.duration(path)
                    record = {
                        "id": f"external:{hashlib.sha256(path.name.encode()).hexdigest()[:24]}",
                        "title": path.stem,
                        "filename": path.name,
                        "duration": seconds,
                        "sampleRate": rate,
                        "format": path.suffix[1:].lower(),
                        "created": datetime.fromtimestamp(path.stat().st_mtime, UTC).isoformat(),
                        "language": None,
                        "model": None,
                        "voice": None,
                        "seed": None,
                        "loudnessGain": None,
                        "requestedModel": None,
                        "sourceCharacters": None,
                        "speed": None,
                        "trimStart": None,
                        "settingsSnapshot": None,
                        "metadataAvailable": False,
                        "external": True,
                        "parts": [],
                    }
                record["companions"] = [
                    extension
                    for extension in ("srt", "vtt", "txt", "json")
                    if path.with_suffix(f".{extension}").is_file()
                ]
                records[record["id"]] = record
            except (ValueError, KeyError, OSError, RuntimeError):
                log.warning("Skipping unreadable library entry %s", path.name, exc_info=True)
        self.records = records
        return sorted(records.values(), key=lambda record: record["created"], reverse=True)

    def output_path(self, output_id: str) -> Path:
        record = self.records.get(output_id)
        if not record:
            raise ValueError("That narration no longer exists. Refresh the library.")
        path = self.storage.outputs / record["filename"]
        if path.parent != self.storage.outputs or path.is_symlink() or not path.is_file():
            raise ValueError("The narration file is missing.")
        return path

    def media_path(self, media_id: str) -> Path:
        if media_id.startswith("voice:"):
            path = self.voice_paths.get(media_id[6:])
        else:
            path = self.preview_paths.get(media_id)
        if path and path.is_file():
            return path
        return self.output_path(media_id)

    def export(self, output_id: str, kind: str, destination: Path) -> None:
        path = self.output_path(output_id)
        companions = [
            path.with_suffix(f".{extension}")
            for extension in ("srt", "vtt", "txt", "json")
            if path.with_suffix(f".{extension}").is_file()
        ]
        if kind == "zip":
            with zipfile.ZipFile(destination, "w", zipfile.ZIP_DEFLATED) as archive:
                for file in [path, *companions]:
                    archive.write(file, file.name)
        else:
            source = path if kind == "audio" else path.with_suffix(f".{kind}")
            if not source.is_file():
                raise ValueError("That companion file is unavailable.")
            if source.resolve() == destination.resolve():
                return
            shutil.copyfile(source, destination)

    def delete(self, output_id: str) -> None:
        path = self.output_path(output_id)
        for file in [
            path,
            *(path.with_suffix(f".{extension}") for extension in ("srt", "vtt", "txt", "json")),
        ]:
            file.unlink(missing_ok=True)
        self.records.pop(output_id, None)

    def voices(self) -> list[dict]:
        registry = read_json(self.storage.voices / "registry.json", {})
        result = [
            {
                "id": "default",
                "label": "Original narrator",
                "kind": "built-in",
                "description": "Uses the model’s built-in voice when available.",
                "duration": None,
                "previewAvailable": False,
                "available": True,
            }
        ]
        self.voice_paths = {}
        self.voice_transcripts = {}
        for path in sorted(self.storage.voices.iterdir()):
            if path.suffix.lower() not in AUDIO_EXTENSIONS or path.is_symlink():
                continue
            try:
                seconds, _ = audio.duration(path)
            except (ValueError, RuntimeError, OSError):
                log.warning("Skipping unreadable voice %s", path.name)
                continue
            saved = registry.get(path.name)
            label = saved.get("label") if isinstance(saved, dict) else saved
            voice_id = f"custom:{path.stem}" if saved else f"file:{path.name}"
            self.voice_paths[voice_id] = path
            transcript = saved.get("transcript") if isinstance(saved, dict) else None
            if isinstance(transcript, str) and transcript:
                self.voice_transcripts[voice_id] = transcript
            result.append(
                {
                    "id": voice_id,
                    "label": label or path.stem,
                    "kind": "custom" if saved else "external",
                    "description": "Saved reference recording."
                    if saved
                    else "Recording in your voice folder.",
                    "duration": seconds,
                    "previewAvailable": True,
                    "hasTranscript": voice_id in self.voice_transcripts,
                    "available": True,
                }
            )
        return result

    def save_voice(self, reference: Path | None, label: str, transcript: str) -> str:
        if not reference or not reference.is_file():
            raise ValueError("Attach or record a voice reference first.")
        label = label.strip()
        if not label:
            raise ValueError("Give the voice a name.")
        registry = read_json(self.storage.voices / "registry.json", {})
        path = self.storage.voices / f"{uuid4().hex}.wav"
        registry[path.name] = {"label": label, "transcript": transcript.strip()}
        try:
            shutil.copyfile(reference, path)
            write_json(self.storage.voices / "registry.json", registry)
        except OSError:
            path.unlink(missing_ok=True)
            raise
        return f"custom:{path.stem}"

    def delete_voice(self, voice_id: str) -> None:
        path = self.voice_paths.get(voice_id)
        registry = read_json(self.storage.voices / "registry.json", {})
        if not path or not voice_id.startswith("custom:") or path.name not in registry:
            raise ValueError("Only your saved presets can be deleted here.")
        path.unlink(missing_ok=True)
        del registry[path.name]
        write_json(self.storage.voices / "registry.json", registry)


def companions(path: Path, record: dict, text: str) -> None:
    def timestamp(seconds: float, separator: str) -> str:
        milliseconds = max(0, round(seconds * 1000))
        seconds, milliseconds = divmod(milliseconds, 1000)
        minutes, seconds = divmod(seconds, 60)
        hours, minutes = divmod(minutes, 60)
        return f"{hours:02}:{minutes:02}:{seconds:02}{separator}{milliseconds:03}"

    srt, vtt, cursor = [], ["WEBVTT\n"], 0.0
    number = 0
    for part in record["parts"]:
        end = min(record["duration"], cursor + part["duration"])
        if part["text"].strip() and end > cursor:
            number += 1
            srt.append(
                f"{number}\n{timestamp(cursor, ',')} --> {timestamp(end, ',')}\n{part['text']}\n"
            )
            vtt.append(f"{timestamp(cursor, '.')} --> {timestamp(end, '.')}\n{part['text']}\n")
        cursor = end + part["pause"]
    path.with_suffix(".srt").write_text("\n".join(srt), encoding="utf-8")
    path.with_suffix(".vtt").write_text("\n".join(vtt), encoding="utf-8")
    path.with_suffix(".txt").write_text(text, encoding="utf-8")
    write_json(path.with_suffix(".json"), {"phonivraVersion": 1, "output": record})
