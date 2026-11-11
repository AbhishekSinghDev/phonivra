"""Studio application service, independent of HTTP and Electron."""

import copy
import importlib.util
import logging
import threading
import zipfile
from collections import deque
from pathlib import Path
from uuid import uuid4

from pydantic import ValidationError

from . import audio, text
from .contract import (
    AUDIO_EXTENSIONS,
    DEVICE_MODES,
    MAX_AUDIO_IMPORT_BYTES,
    MAX_TEXT_LENGTH,
    SCRIPT_EXTENSIONS,
)
from .inference import Narrator
from .jobs import Jobs
from .library import Library
from .models import Models
from .recording import Recorder
from .schemas import Command, DesktopOperation, Settings
from .storage import Storage, read_json, selected_file, write_json

log = logging.getLogger(__name__)

PREVIEW_TEXT = {
    "ar": "مرحباً، هذه عينة صوتية لمساعدتك على اختيار الصوت المناسب لقصتك.",
    "da": "Hej, dette er en stemmeprøve til din næste fortælling.",
    "de": "Hallo, dies ist eine Hörprobe für deine nächste Geschichte.",
    "el": "Γεια σας, αυτό είναι ένα δείγμα φωνής για την επόμενη ιστορία σας.",
    "en": "Every story has a voice. This is a short preview of your narrator.",
    "es": "Hola, esta es una muestra de voz para tu próxima historia.",
    "fi": "Hei, tämä on ääninäyte seuraavaa tarinaasi varten.",
    "fr": "Bonjour, voici un aperçu de la voix pour votre prochaine histoire.",
    "he": "שלום, זוהי דוגמת קול לסיפור הבא שלכם.",
    "hi": "हर कहानी की अपनी आवाज़ होती है। यह आपके कथावाचक की आवाज़ का एक छोटा नमूना है।",
    "it": "Ciao, questa è una breve anteprima della voce per la tua prossima storia.",
    "ja": "こんにちは。これは、あなたの物語に使う声の短いサンプルです。",
    "ko": "안녕하세요. 다음 이야기에 사용할 목소리의 짧은 미리 듣기입니다.",
    "ms": "Helo, ini ialah contoh suara untuk cerita anda yang seterusnya.",
    "nl": "Hallo, dit is een kort stemvoorbeeld voor je volgende verhaal.",
    "no": "Hei, dette er en stemmeprøve for din neste fortelling.",
    "pl": "Witaj, to krótka próbka głosu do twojej następnej historii.",
    "pt": "Olá, esta é uma pequena amostra da voz para a sua próxima história.",
    "ru": "Здравствуйте, это короткий образец голоса для вашей следующей истории.",
    "sv": "Hej, det här är ett röstprov för din nästa berättelse.",
    "sw": "Habari, hii ni sampuli fupi ya sauti kwa hadithi yako inayofuata.",
    "tr": "Merhaba, bu bir sonraki hikayeniz için kısa bir ses örneğidir.",
    "zh": "你好，这是为你的下一个故事准备的一小段声音预览。",
}


class Studio:
    def __init__(self, root: Path):
        self.lock = threading.RLock()
        self.storage = Storage(root)
        saved = self.storage.saved
        self.settings = Settings.model_validate(saved.get("settings", {}))
        self.saved_settings = Settings.model_validate(
            saved.get("savedSettings", self.settings.model_dump())
        )
        self.script = saved.get("script", "")
        self.dictionary = saved.get("dictionary", "")
        self.revision = 0
        self.document_revision = 0
        self.inspection = None
        self.preview = None
        self.reference_path: Path | None = None
        self.reference = {"status": "empty", "name": "", "duration": 0}
        self.job = {
            "id": "idle",
            "kind": "narration",
            "phase": "idle",
            "progress": 0,
            "title": "",
            "message": "Ready when you are.",
            "part": 0,
            "total": 0,
            "elapsed": 0,
            "remaining": None,
            "streaming": "unavailable",
            "paused": False,
        }
        self.jobs = Jobs(self.update_job)
        self.models = Models(self.storage.model_root, self.jobs)
        mode = saved.get("device", "auto")
        self.models.mode = mode if mode in DEVICE_MODES else "auto"
        self.device_info = self.models.device()
        self.library = Library(self.storage)
        self.voices = self.library.voices()
        self.outputs = self.library.refresh()
        self.selected_output = self.outputs[0]["id"] if self.outputs else None
        self.playback = {"playing": False, "position": 0, "outputId": None}
        self.batch = {
            "source": "files",
            "files": [],
            "text": saved.get("batchText", ""),
            "splitChapters": True,
            "reviewed": False,
        }
        self.batch_files: dict[str, tuple[str, str]] = {}
        self.unit_texts: dict[str, str] = {}
        self.units: list[dict] = []
        self.narrator = Narrator(self.models, self.jobs)
        self.recorder = Recorder(self.storage.temporary)
        self.recording_available = self.recorder.available()
        self.watermark = None
        self.status = None
        self.status_is_error = False
        self.online = False
        self.events: deque[str] = deque(
            ["Local engine started. No remote inference or reporting."], maxlen=50
        )

    def changed(self) -> None:
        self.revision += 1

    def update_job(self, **fields) -> None:
        with self.lock:
            self.job.update(fields)
            if fields.get("phase") in {"complete", "error", "stopped"}:
                self.events.append(fields.get("message", "Job finished."))
                if fields["phase"] == "stopped":
                    for unit in self.units:
                        if unit["status"] == "generating":
                            unit.update(
                                status="pending", message="Stopped before this item finished."
                            )
            self.changed()

    def persist(self) -> None:
        self.storage.save(
            {
                "version": 1,
                "settings": self.settings.model_dump(),
                "savedSettings": self.saved_settings.model_dump(),
                "script": self.script,
                "dictionary": self.dictionary,
                "batchText": self.batch["text"],
                "cachePath": str(self.models.root),
                "device": self.models.mode,
            }
        )

    def snapshot(self) -> dict:
        with self.lock:
            models = self.models.catalog()
            for model in models:
                if model["id"] == self.jobs.download_id:
                    model["progress"] = self.job["progress"]
            preview_bytes = sum(
                p.stat().st_size for p in self.storage.previews.iterdir() if p.is_file()
            )
            return copy.deepcopy(
                {
                    "revision": self.revision,
                    "settings": self.settings.model_dump(),
                    "script": self.script,
                    "documentRevision": self.document_revision,
                    "inspection": self.inspection,
                    "preview": self.preview,
                    "dictionary": self.dictionary,
                    "reference": self.reference,
                    "job": self.job,
                    "voices": self.voices,
                    "models": models,
                    "outputs": self.outputs,
                    "units": self.units,
                    "batch": self.batch,
                    "configuration": {
                        "saved": self.saved_settings.model_dump(),
                        "preferences": {
                            "cachePath": str(self.models.root),
                            "tokenConfigured": bool(self.models.token)
                            or (self.storage.root / "download-credential.bin").is_file(),
                            "previewBytes": preview_bytes,
                            "logs": list(self.events),
                        },
                    },
                    "watermark": self.watermark,
                    "statusIsError": self.status_is_error,
                    "device": self.device_info,
                    "dependencies": {
                        "ffmpeg": bool(audio.media_binary("ffmpeg")),
                        "recording": self.recording_available,
                        "perth": importlib.util.find_spec("perth") is not None,
                        "online": self.online,
                    },
                    "status": self.status,
                    "playback": self.playback,
                    "selectedOutput": self.selected_output,
                }
            )

    def dispatch(self, command: Command) -> dict:
        with self.lock:
            self.status, self.status_is_error = None, False
            try:
                self._dispatch(command)
            except (ValueError, OSError, ValidationError) as error:
                self.status, self.status_is_error = str(error), True
            self.changed()
            return self.snapshot()

    def _dispatch(self, command: Command) -> None:
        kind = command.type
        if kind == "settings.update":
            self.settings = command.settings
            self.inspection = None
            self.batch["reviewed"] = False
            self.persist()
        elif kind == "script.update":
            self.script, self.inspection = command.text, None
            self.persist()
        elif kind == "dictionary.save":
            text.dictionary_rules(command.text)
            self.dictionary, self.inspection = command.text, None
            self.persist()
            self.status = "Pronunciation dictionary saved."
        elif kind == "script.inspect":
            settings = self.effective_settings(self.script)
            prepared = text.prepare(self.script, settings, self.dictionary)
            chunks = text.split_chunks(prepared, settings.chunk_limit, settings.gap)
            self.inspection = {
                "status": "ready",
                "preparedText": prepared,
                "error": None,
                "parts": [
                    {
                        "id": f"part-{i}",
                        "index": i + 1,
                        "text": chunk.text,
                        "duration": 0,
                        "pause": chunk.pause,
                    }
                    for i, chunk in enumerate(chunks)
                ],
                "notes": [
                    f"Language: {settings.language}. Part timings are available after generation."
                ],
            }
        elif kind == "status.dismiss":
            self.status = None
        elif kind == "settings.restore":
            self.settings = Settings()
            self.inspection = None
            self.persist()
        elif kind == "preferences.save":
            self.saved_settings = self.settings.model_copy()
            self.persist()
            self.status = "Preferences saved."
        elif kind == "device.set":
            self.jobs.require_idle()
            previous = self.models.mode
            self.models.mode = command.mode
            device = self.models.device()
            if not device["available"]:
                self.models.mode = previous
                raise ValueError(f"{command.mode.upper()} is unavailable. Choose CPU or Auto.")
            self.models.release()
            self.device_info = device
            self.persist()
        elif kind in {"job.start", "batch.start"}:
            self.start_job(command.kind if kind == "job.start" else "batch")
        elif kind == "job.cancel":
            self.jobs.cancel()
        elif kind == "model.download":
            self.jobs.start(
                "download", f"Download {command.id}", lambda: self.models.download(command.id)
            )
        elif kind == "model.pause":
            self.jobs.pause(command.id, command.paused)
        elif kind == "model.remove":
            if not command.confirmed:
                raise ValueError("Confirm model removal first.")
            self.models.remove(command.id)
            self.status = "Model removed. Other installed models were preserved."
        elif kind.startswith("batch."):
            self.batch_command(command)
        elif kind.startswith(("reference.", "voice")):
            self.voice_command(command)
        elif kind.startswith("output"):
            self.output_command(command)
        elif kind == "credentials.set":
            self.models.token = command.token
            self.status = "Download credential connected."
        elif kind == "credentials.remove":
            self.models.token = None
            self.status = "Download credential removed."
        elif kind == "previews.clear":
            self.jobs.require_idle()
            for file in self.storage.previews.iterdir():
                if file.is_file():
                    file.unlink()
            self.preview = None
            self.library.preview_paths.clear()
            self.playback = {"playing": False, "position": 0, "outputId": None}
            self.status = "Temporary previews removed."
        elif kind == "diagnostics.refresh":
            import httpx

            try:
                self.online = httpx.head("https://huggingface.co", timeout=5).is_success
            except httpx.HTTPError:
                self.online = False
            self.device_info = self.models.device()
            self.events.append(
                f"Device: {self.device_info['label']}. Model host reachable: {self.online}."
            )
        else:
            raise ValueError(f"Unsupported engine command: {kind}")

    def effective_settings(self, script: str, settings: Settings | None = None) -> Settings:
        value = (settings or self.settings).model_copy()
        if value.auto_detect:
            value.language = text.detect_language(script, value.language)
        return value

    def start_job(self, kind: str) -> None:
        self.jobs.require_idle()
        if self.reference["status"] in {"recording", "error", "missing"}:
            raise ValueError("Finish or clear the voice reference before generating.")
        settings = self.settings.model_copy()
        dictionary = self.dictionary
        reference = self.reference_path or self.library.voice_paths.get(settings.voice)
        if self.reference_path is None and settings.voice != "default" and reference is None:
            raise ValueError("That voice is missing. Refresh the voice collection.")
        voice = (
            self.reference["name"]
            if self.reference_path
            else next(
                (voice["label"] for voice in self.voices if voice["id"] == settings.voice),
                "Original narrator",
            )
        )
        if kind == "batch":
            if not self.batch["reviewed"]:
                self.prepare_batch()
            if not self.units:
                raise ValueError("Add scripts and prepare the batch first.")
            plan = [(copy.deepcopy(unit), self.unit_texts[unit["id"]]) for unit in self.units]
            for unit in self.units:
                unit.update(status="pending")
                unit.pop("message", None)
                unit.pop("outputId", None)

            def work():
                failures = 0
                for unit, script in plan:
                    self.jobs.checkpoint()
                    with self.lock:
                        current = next(item for item in self.units if item["id"] == unit["id"])
                        current["status"] = "generating"
                        self.changed()
                    try:
                        item_settings = self.effective_settings(script, settings)
                        item_settings.title = unit["title"][:120]
                        record = self.narrator.generate(
                            script,
                            item_settings,
                            dictionary,
                            reference,
                            voice,
                            self.storage.outputs,
                        )
                        with self.lock:
                            current.update(status="complete", outputId=record["id"])
                            self.accept_output(record)
                    except (ValueError, RuntimeError) as error:
                        failures += 1
                        with self.lock:
                            current.update(status="error", message=str(error))
                            self.changed()
                if failures:
                    raise ValueError(
                        f"Batch finished with {failures} failed item(s). Completed files are in the library."
                    )
        else:
            settings = (
                settings if kind == "preview" else self.effective_settings(self.script, settings)
            )
            if kind == "narration" and settings.auto_detect:
                self.settings.language = settings.language
            script = PREVIEW_TEXT[settings.language] if kind == "preview" else self.script
            if not script.strip():
                raise ValueError("Write or import a script first.")

            def work():
                directory = self.storage.previews if kind == "preview" else self.storage.outputs
                record = self.narrator.generate(
                    script, settings, dictionary, reference, voice, directory
                )
                with self.lock:
                    if kind == "preview":
                        # Only the generated audio is a retained preview artifact.
                        preview_path = directory / record["filename"]
                        for extension in ("srt", "vtt", "txt", "json"):
                            preview_path.with_suffix(f".{extension}").unlink(missing_ok=True)
                        self.library.preview_paths[record["id"]] = directory / record["filename"]
                        self.preview = {
                            "id": record["id"],
                            "language": settings.language,
                            "duration": record["duration"],
                            "text": script,
                        }
                    else:
                        self.accept_output(record)
                    self.changed()

        self.saved_settings = self.settings.model_copy()
        self.persist()
        self.jobs.start(kind, settings.title or kind.title(), work)

    def accept_output(self, record: dict) -> None:
        self.library.records[record["id"]] = record
        self.outputs.insert(0, record)
        self.selected_output = record["id"]
        self.changed()

    def batch_command(self, command: Command) -> None:
        self.jobs.require_idle()
        if command.type == "batch.source":
            self.batch["source"] = command.source
        elif command.type == "batch.text":
            self.batch["text"] = command.text
            self.persist()
        elif command.type == "batch.split":
            self.batch["splitChapters"] = command.enabled
        elif command.type == "batch.remove-file":
            self.batch_files.pop(command.id, None)
            self.batch["files"] = [file for file in self.batch["files"] if file["id"] != command.id]
        elif command.type == "batch.prepare":
            self.prepare_batch()
            return
        self.batch["reviewed"] = False
        self.units = []

    def prepare_batch(self) -> None:
        self.jobs.require_idle()
        sources = (
            list(self.batch_files.values())
            if self.batch["source"] == "files"
            else [(self.settings.title or "Narration", self.batch["text"])]
        )
        units, contents = [], {}
        for title, content in sources:
            for heading, script in text.chapters(content, title, self.batch["splitChapters"]):
                unit_id = uuid4().hex
                settings = self.effective_settings(script)
                units.append(
                    {
                        "id": unit_id,
                        "title": heading,
                        "language": settings.language,
                        "status": "pending",
                    }
                )
                contents[unit_id] = script
        self.units, self.unit_texts = units, contents
        self.batch["reviewed"] = True

    def voice_command(self, command: Command) -> None:
        self.jobs.require_idle()
        if command.type == "reference.attach":
            if self.reference["status"] == "recording":
                try:
                    path = self.recorder.finish()
                    try:
                        self.attach_reference(path)
                    finally:
                        path.unlink(missing_ok=True)
                except (ValueError, OSError) as error:
                    self.reference = {
                        "status": "error",
                        "name": "Microphone recording",
                        "duration": 0,
                        "message": str(error),
                    }
                    raise
            else:
                if not self.recording_available:
                    raise ValueError(
                        "Microphone capture is unavailable. Upload a recording instead."
                    )
                self.recorder.start()
                self.reference = {
                    "status": "recording",
                    "name": "Microphone recording",
                    "duration": 0,
                }
        elif command.type == "reference.clear":
            self.recorder.close()
            if self.reference_path:
                self.reference_path.unlink(missing_ok=True)
            self.reference_path = None
            self.reference = {"status": "empty", "name": "", "duration": 0}
        elif command.type == "voice.save":
            self.library.save_voice(self.reference_path, command.label)
            self.voices = self.library.voices()
            self.status = "Voice preset saved."
        elif command.type == "voice.delete":
            if not command.confirmed:
                raise ValueError("Confirm voice deletion first.")
            self.library.delete_voice(command.id)
            if self.settings.voice == command.id:
                self.settings.voice = "default"
                self.persist()
            self.voices = self.library.voices()
        elif command.type == "voices.refresh":
            self.voices = self.library.voices()
            self.status = "Voice collection refreshed."

    def attach_reference(self, path: Path) -> None:
        destination = self.storage.temporary / f"reference-{uuid4().hex}.wav"
        try:
            seconds = audio.reference_audio(path, destination)
        except Exception:
            destination.unlink(missing_ok=True)
            raise
        previous = self.reference_path
        self.reference_path = destination
        self.reference = {"status": "ready", "name": path.name, "duration": seconds}
        if previous:
            previous.unlink(missing_ok=True)

    def output_command(self, command: Command) -> None:
        if command.type == "output.select":
            self.library.output_path(command.id)
            self.selected_output = command.id
        elif command.type == "output.delete":
            self.jobs.require_idle()
            if not command.confirmed:
                raise ValueError("Confirm narration deletion first.")
            self.library.delete(command.id)
            self.outputs = [record for record in self.outputs if record["id"] != command.id]
            if self.selected_output == command.id:
                self.selected_output = self.outputs[0]["id"] if self.outputs else None
            if self.playback["outputId"] == command.id:
                self.playback = {"playing": False, "position": 0, "outputId": None}
        elif command.type == "outputs.refresh":
            self.jobs.require_idle()
            self.outputs = self.library.refresh()
            if self.selected_output not in self.library.records:
                self.selected_output = self.outputs[0]["id"] if self.outputs else None
            self.status = "Library refreshed."
        elif command.type == "output.watermark":
            path = self.library.output_path(command.id)

            def check():
                import librosa
                import perth

                samples, rate = librosa.load(path, sr=None, mono=True)
                score = float(
                    perth.PerthImplicitWatermarker().get_watermark(samples, sample_rate=rate)
                )
                with self.lock:
                    self.watermark = {
                        "outputId": command.id,
                        "state": "detected" if score >= 0.5 else "not-detected",
                        "score": score,
                        "message": f"Watermark score: {score:.3f}. Re-encoding may affect detection.",
                    }
                    self.changed()

            self.jobs.start("preview", "Check audio watermark", check)

    def desktop(self, operation: DesktopOperation) -> dict:
        with self.lock:
            kind = operation.operation
            if kind in {"storage.choose", "reference.import", "project.open", "batch.import"}:
                self.jobs.require_idle()
            paths = operation.paths
            if kind == "credential.restore":
                self.models.token = operation.token
            elif kind == "storage.choose":
                path = Path(paths[0]).resolve()
                path.mkdir(parents=True, exist_ok=True)
                self.models.release()
                # Selecting a folder switches caches; it never moves or deletes the old one.
                self.models.root = path
                self.storage.model_root = path
                self.persist()
                self.status = (
                    "Model folder changed. Existing downloads remain in the previous folder."
                )
            elif kind == "reference.import":
                self.attach_reference(
                    selected_file(paths[0], AUDIO_EXTENSIONS, MAX_AUDIO_IMPORT_BYTES)
                )
            elif kind == "script.import":
                path = selected_file(paths[0], SCRIPT_EXTENSIONS)
                self.script = text.read_script(path)
                self.inspection = None
                self.document_revision += 1
                self.persist()
                self.status = f"Loaded {path.name}."
            elif kind == "batch.import":
                for raw in paths:
                    path = selected_file(raw, SCRIPT_EXTENSIONS)
                    content = text.read_script(path)
                    unit_id = uuid4().hex
                    self.batch_files[unit_id] = (path.stem, content)
                    self.batch["files"].append(
                        {
                            "id": unit_id,
                            "name": path.name,
                            "characters": len(content),
                            "readable": True,
                        }
                    )
                self.batch["reviewed"] = False
                self.units = []
            elif kind == "project.save":
                write_json(
                    Path(paths[0]),
                    {
                        "phonivraProject": 1,
                        "settings": self.settings.model_dump(),
                        "script": self.script,
                        "dictionary": self.dictionary,
                    },
                )
                self.saved_settings = self.settings.model_copy()
                self.persist()
                self.status = "Project saved. Custom voice recordings stay in your voice folder."
            elif kind == "project.open":
                path = selected_file(paths[0], {".json"})
                data = read_json(path)
                if not isinstance(data, dict) or data.get("phonivraProject") != 1:
                    raise ValueError("Choose a Phonivra project file.")
                settings = Settings.model_validate(data["settings"])
                script, dictionary = data.get("script"), data.get("dictionary", "")
                if not isinstance(script, str) or not isinstance(dictionary, str):
                    raise ValueError("The project contains invalid text fields.")
                if len(script) > MAX_TEXT_LENGTH or len(dictionary) > MAX_TEXT_LENGTH:
                    raise ValueError(
                        f"Project text exceeds the {MAX_TEXT_LENGTH:,} character limit."
                    )
                text.dictionary_rules(dictionary)
                self.settings = self.saved_settings = settings
                self.script, self.dictionary = script, dictionary
                self.inspection = None
                self.document_revision += 1
                self.persist()
                self.status = "Project opened."
            elif kind == "output.export":
                if operation.id == "batch" and operation.format == "zip":
                    completed = [
                        unit["outputId"] for unit in self.units if unit["status"] == "complete"
                    ]
                    if not completed:
                        raise ValueError("No completed batch items are available.")
                    with zipfile.ZipFile(paths[0], "w", zipfile.ZIP_DEFLATED) as archive:
                        for output_id in completed:
                            audio_path = self.library.output_path(output_id)
                            for file in [
                                audio_path,
                                *(
                                    audio_path.with_suffix(f".{extension}")
                                    for extension in ("srt", "vtt", "txt", "json")
                                ),
                            ]:
                                if file.is_file():
                                    archive.write(file, file.name)
                else:
                    self.library.export(operation.id, operation.format, Path(paths[0]))
                self.status = "File exported."
            self.status_is_error = False
            self.changed()
            return self.snapshot()

    def close(self) -> None:
        self.recorder.close()
        self.jobs.close()
