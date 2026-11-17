"""Library sidecars, exports, and app-owned voice recordings."""

import hashlib
import logging
import re
import shutil
import zipfile
from collections.abc import Callable
from datetime import UTC, datetime
from pathlib import Path
from tempfile import NamedTemporaryFile
from uuid import uuid4

from . import audio
from .contract import AUDIO_EXTENSIONS
from .jobs import Jobs
from .schemas import Input, OutputRecord
from .storage import Storage, Utf8Text, read_json, recover_fields, write_json

log = logging.getLogger(__name__)

COMPANION_EXTENSIONS = ("srt", "vtt", "txt", "json")


def companion_paths(path: Path) -> list[Path]:
    return [path.with_suffix(f".{extension}") for extension in COMPANION_EXTENSIONS]


def export_files(
    sources: list[Path],
    destination: Path,
    *,
    archive: bool,
    jobs: Jobs | None = None,
    publish: Callable[[Path], None] | None = None,
) -> None:
    def copy(source, target):
        with source.open("rb") as file:
            while block := file.read(1024 * 1024):
                if jobs:
                    jobs.checkpoint()
                target.write(block)

    if not archive:
        source = sources[0]
        if not source.is_file():
            raise ValueError("That companion file is unavailable.")
        if source.resolve() == destination.resolve():
            return
    elif any(source.resolve() == destination.resolve() for source in sources):
        raise ValueError("Choose an export destination outside the source files.")

    with NamedTemporaryFile(
        dir=destination.parent, prefix=".phonivra-export-", delete=False
    ) as file:
        staging = Path(file.name)
    try:
        if archive:
            with zipfile.ZipFile(staging, "w", zipfile.ZIP_DEFLATED) as output:
                for source in sources:
                    if jobs:
                        jobs.checkpoint()
                    with output.open(source.name, "w", force_zip64=True) as member:
                        copy(source, member)
        else:
            with staging.open("wb") as file:
                copy(source, file)
        if publish:
            publish(staging)
        else:
            staging.replace(destination)
    finally:
        staging.unlink(missing_ok=True)


def filename(title: str) -> str:
    return re.sub(r"[^\w.-]+", "-", title, flags=re.UNICODE).strip(".-")[:80] or "narration"


class VoiceMetadata(Input):
    label: Utf8Text = ""
    transcript: Utf8Text = ""


def normalize_registry(data: object) -> tuple[dict, bool]:
    if not isinstance(data, dict):
        return {"version": 1, "voices": {}}, True
    if "version" in data:
        if type(data["version"]) is not int or data["version"] != 1:
            raise ValueError("Unsupported voice registry version.")
        data = data.get("voices")
        if not isinstance(data, dict):
            raise ValueError("Expected voice entries.")

    voices = {}
    repaired = False
    for name, entry in data.items():
        try:
            name.encode("utf-8")
        except UnicodeEncodeError:
            repaired = True
            continue
        if isinstance(entry, str):
            entry = {"label": entry} if entry else {}
        if not isinstance(entry, dict):
            repaired = True
            continue
        metadata, damaged = recover_fields(VoiceMetadata, entry)
        repaired |= damaged
        if metadata:
            voices[name] = metadata
    return {"version": 1, "voices": voices}, repaired


class Library:
    def __init__(self, storage: Storage):
        self.storage = storage
        self.registry_file = storage.voices / "registry.json"
        self.records: dict[str, dict] = {}
        self.voice_transcripts: dict[str, str] = {}
        self.voice_paths: dict[str, Path] = {}
        self.preview_paths: dict[str, Path] = {}

    def scan_outputs(self, jobs: Jobs | None = None) -> dict[str, dict]:
        records = {}
        for path in self.storage.outputs.iterdir():
            if jobs:
                jobs.checkpoint()
            if path.suffix.lower() not in AUDIO_EXTENSIONS or path.is_symlink():
                continue
            try:
                data = read_json(path.with_suffix(".json"))
                if isinstance(data, dict) and data.get("phonivraVersion") == 1:
                    output = OutputRecord.model_validate(data["output"])
                    record = output.model_dump(
                        exclude={"backend"} if output.backend is None else None
                    )
                    if record.get("filename") != path.name:
                        raise ValueError("Sidecar filename does not match audio.")
                else:
                    seconds, rate = audio.duration(path, jobs) if jobs else audio.duration(path)
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
                    for extension in COMPANION_EXTENSIONS
                    if path.with_suffix(f".{extension}").is_file()
                ]
                records[record["id"]] = record
            except (ValueError, KeyError, OSError, RuntimeError):
                log.warning("Skipping unreadable library entry %s", path.name, exc_info=True)
        return records

    def refresh(self) -> list[dict]:
        self.records = self.scan_outputs()
        return sorted(self.records.values(), key=lambda record: record["created"], reverse=True)

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

    def export_sources(self, output_id: str, kind: str) -> list[Path]:
        path = self.output_path(output_id)
        if kind == "zip":
            return [path, *(file for file in companion_paths(path) if file.is_file())]
        return [path if kind == "audio" else path.with_suffix(f".{kind}")]

    def export(self, output_id: str, kind: str, destination: Path) -> None:
        export_files(self.export_sources(output_id, kind), destination, archive=kind == "zip")

    def delete(self, output_id: str) -> None:
        path = self.output_path(output_id)
        for file in [path, *companion_paths(path)]:
            file.unlink(missing_ok=True)
        self.records.pop(output_id, None)

    def read_registry(self) -> dict:
        return self.storage.load_document(self.registry_file, normalize_registry).get("voices", {})

    def save_registry(self, registry: dict) -> None:
        self.storage.save_document(self.registry_file, {"version": 1, "voices": registry})

    @staticmethod
    def default_voice() -> dict:
        return {
            "id": "default",
            "label": "Original narrator",
            "kind": "built-in",
            "description": "Uses the model’s built-in voice when available.",
            "duration": None,
            "previewAvailable": False,
            "available": True,
        }

    @staticmethod
    def voice_definition(
        voice_id: str, label: str, seconds: float, *, custom: bool, has_transcript: bool
    ) -> dict:
        return {
            "id": voice_id,
            "label": label,
            "kind": "custom" if custom else "external",
            "description": "Saved reference recording."
            if custom
            else "Recording in your voice folder.",
            "duration": seconds,
            "previewAvailable": True,
            "hasTranscript": has_transcript,
            "available": True,
        }

    def scan_voices(
        self, jobs: Jobs | None = None
    ) -> tuple[list[dict], dict[str, Path], dict[str, str]]:
        registry = self.read_registry()
        result = [self.default_voice()]
        paths, transcripts = {}, {}
        for path in sorted(self.storage.voices.iterdir()):
            if jobs:
                jobs.checkpoint()
            if path.suffix.lower() not in AUDIO_EXTENSIONS or path.is_symlink():
                continue
            try:
                seconds, _ = audio.duration(path, jobs) if jobs else audio.duration(path)
            except (ValueError, RuntimeError, OSError):
                log.warning("Skipping unreadable voice %s", path.name)
                continue
            saved = registry.get(path.name, {})
            voice_id = f"custom:{path.stem}" if saved else f"file:{path.name}"
            paths[voice_id] = path
            transcript = saved.get("transcript")
            if transcript:
                transcripts[voice_id] = transcript
            result.append(
                self.voice_definition(
                    voice_id,
                    saved.get("label") or path.stem,
                    seconds,
                    custom=bool(saved),
                    has_transcript=bool(transcript),
                )
            )
        return result, paths, transcripts

    def voices(self) -> list[dict]:
        result, self.voice_paths, self.voice_transcripts = self.scan_voices()
        return result

    def save_voice(self, reference: Path | None, label: str, transcript: str) -> str:
        if not reference or not reference.is_file():
            raise ValueError("Attach or record a voice reference first.")
        label = label.strip()
        if not label:
            raise ValueError("Give the voice a name.")
        registry = self.read_registry()
        path = self.storage.voices / f"{uuid4().hex}.wav"
        registry[path.name] = {"label": label, "transcript": transcript.strip()}
        try:
            shutil.copyfile(reference, path)
            self.save_registry(registry)
        except OSError:
            path.unlink(missing_ok=True)
            raise
        return f"custom:{path.stem}"

    def delete_voice(self, voice_id: str) -> None:
        path = self.voice_paths.get(voice_id)
        registry = self.read_registry()
        if not path or not voice_id.startswith("custom:") or path.name not in registry:
            raise ValueError("Only your saved presets can be deleted here.")
        del registry[path.name]
        self.save_registry(registry)
        path.unlink(missing_ok=True)


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
