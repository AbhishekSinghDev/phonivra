"""Studio application service, independent of HTTP and Electron."""

import copy
import importlib.util
import logging
import shutil
import threading
from collections import deque
from pathlib import Path
from uuid import uuid4

from pydantic import ValidationError

from . import audio, text, watermark
from .contract import (
    AUDIO_EXTENSIONS,
    DEVICE_MODES,
    MAX_AUDIO_IMPORT_BYTES,
    MAX_TEXT_LENGTH,
    SCRIPT_EXTENSIONS,
)
from .inference import Narrator
from .jobs import Cancelled, Jobs
from .library import Library, export_files
from .models import Models
from .recording import Recorder
from .schemas import Command, DesktopOperation, Settings, resolve_model
from .storage import (
    Storage,
    migrate_settings,
    prepare_model_root,
    read_json,
    selected_file,
    write_json,
)

log = logging.getLogger(__name__)

PREVIEW_TEXT = {
    "as": "নমস্কাৰ, এয়া আপোনাৰ কাহিনীৰ বাবে এটা সৰু নমুনা।",
    "bn": "নমস্কার, এটি আপনার গল্পের জন্য একটি ছোট নমুনা।",
    "gu": "નમસ્તે, આ તમારી વાર્તા માટે એક નાનું ઉદાહરણ છે.",
    "kn": "ನಮಸ್ಕಾರ, ಇದು ನಿಮ್ಮ ಕಥೆಗಾಗಿ ಒಂದು ಚಿಕ್ಕ ಮಾದರಿ.",
    "ml": "നമസ്കാരം, ഇത് നിങ്ങളുടെ കഥയ്ക്കുള്ള ഒരു ചെറിയ മാതൃകയാണ്.",
    "mr": "नमस्कार, हा तुमच्या कथेचा एक छोटा नमुना आहे.",
    "or": "ନମସ୍କାର, ଏହା ଆପଣଙ୍କ କାହାଣୀ ପାଇଁ ଏକ ଛୋଟ ନମୁନା।",
    "pa": "ਸਤਿ ਸ੍ਰੀ ਅਕਾਲ, ਇਹ ਤੁਹਾਡੀ ਕਹਾਣੀ ਲਈ ਇੱਕ ਛੋਟਾ ਨਮੂਨਾ ਹੈ।",
    "ta": "வணக்கம், இது உங்கள் கதைக்கான ஒரு சிறிய மாதிரி.",
    "te": "నమస్కారం, ఇది మీ కథ కోసం ఒక చిన్న నమూనా.",
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
    def __init__(self, root: Path, *, defer_discovery: bool = False):
        self.lock = threading.RLock()
        self.storage = Storage(root)
        saved = self.storage.saved
        self.settings = self.load_settings(saved.get("settings", {}))
        self.saved_settings = self.load_settings(
            saved.get("savedSettings", self.settings.model_dump())
        )
        self.script = saved.get("script", "")
        self.dictionary = saved.get("dictionary", "")
        self.revision = 0
        self.outputs_revision = 0
        self.document_revision = 0
        self.inspection = None
        self.preview = None
        self.reference_path: Path | None = None
        self.reference = {"status": "empty", "name": "", "duration": 0}
        self.pre_recording_reference = self.reference
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
        self.maintenance_job = None
        self.maintenance = Jobs(self.update_maintenance, "Operation stopped.")
        self.models = Models(self.storage.model_root, self.jobs)
        mode = saved.get("device", "auto")
        self.models.mode = mode if mode in DEVICE_MODES else "auto"
        # Older versions exposed HIP through the CUDA preference.
        if self.models.mode == "cuda" and self.models.backend() == "cpu":
            self.models.mode = "rocm"
            if self.models.backend() != "rocm":
                self.models.mode = "cuda"
        self.device_info = self.models.device()
        self.library = Library(self.storage)
        self.voices = [self.library.default_voice()]
        self.outputs = []
        self.selected_output = None
        self.setup_complete = saved.get("setupComplete") is True
        self.setup_resuming = saved.get("setupComplete") is False and self.settings.model != "auto"
        self.setup_model_sizes: dict[str, int | None] = {}
        self.setup_test: tuple[str, Settings] | None = None
        self.legacy_settings = (
            self.settings.model_copy()
            if saved.keys() - {"version"} and "setupComplete" not in saved
            else None
        )
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
        self.status = " ".join(self.storage.recovery_warnings) or None
        self.status_is_error = self.status is not None
        self.online = False
        self.events: deque[str] = deque(
            ["Local engine started. No remote inference or reporting."], maxlen=50
        )
        if not defer_discovery:
            self.discover()

    def start_discovery(self) -> None:
        with self.lock:
            self.maintenance.start(
                "maintenance", "Discover saved audio", lambda: self.discover(self.maintenance)
            )

    def discover(self, jobs: Jobs | None = None) -> None:
        self.refresh_voices(jobs)
        self.refresh_outputs(jobs, progress=50)

    def refresh_voices(self, jobs: Jobs | None = None) -> None:
        if jobs:
            jobs.progress("preparing", 0, "Looking for voice recordings…")
        warnings_before = len(self.storage.recovery_warnings)
        voices, paths, transcripts = self.library.scan_voices(jobs)
        legacy = self.legacy_settings
        complete = False
        if legacy and self.setup_media_ready():
            model = resolve_model(legacy)
            complete = bool(
                self.device_info["available"]
                and (model != "turbo" or legacy.language == "en")
                and (legacy.voice == "default" or legacy.voice in paths)
                and self.models.installed(model)
            )
        with self.lock:
            if jobs:
                jobs.checkpoint()
            self.voices = voices
            self.library.voice_paths = paths
            self.library.voice_transcripts = transcripts
            self.legacy_settings = None
            if complete and not self.setup_complete:
                self.setup_complete = True
                try:
                    self.persist()
                except OSError:
                    self.storage.warn("Could not save the recovered setup state.")
            warnings = self.storage.recovery_warnings[warnings_before:]
            earlier_warning = " ".join(self.storage.recovery_warnings[:warnings_before])
            if warnings and self.status in (None, earlier_warning):
                self.status = " ".join(self.storage.recovery_warnings)
                self.status_is_error = True
            self.changed()

    def refresh_outputs(self, jobs: Jobs | None = None, *, progress: int = 0) -> None:
        if jobs:
            jobs.progress("preparing", progress, "Looking for saved narrations…")
        with self.lock:
            known = set(self.library.records)
        records = self.library.scan_outputs(jobs)
        with self.lock:
            if jobs:
                jobs.checkpoint()
            # Generation can publish new outputs while the directory is being scanned.
            records.update(
                (key, value) for key, value in self.library.records.items() if key not in known
            )
            self.library.records = records
            self.outputs = sorted(
                records.values(), key=lambda record: record["created"], reverse=True
            )
            self.outputs_revision += 1
            if self.selected_output not in records:
                self.selected_output = self.outputs[0]["id"] if self.outputs else None
            self.changed()

    def update_maintenance(self, **fields) -> None:
        with self.lock:
            if "id" in fields:
                self.maintenance_job = {}
            self.maintenance_job.update(fields)
            self.changed()

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

    @staticmethod
    def setup_media_ready() -> bool:
        return bool(audio.media_binary("ffmpeg") and audio.media_binary("ffprobe"))

    def persist(
        self,
        *,
        setup_complete: bool | None = None,
        cache_path: Path | None = None,
        script: str | None = None,
        batch_text: str | None = None,
        settings: Settings | None = None,
    ) -> None:
        cache_preference = (
            str(cache_path) if cache_path else self.storage.saved.get("cachePath", "")
        )
        self.storage.save(
            {
                "version": 1,
                "setupComplete": self.setup_complete if setup_complete is None else setup_complete,
                "settings": (settings if settings is not None else self.settings).model_dump(),
                "savedSettings": self.saved_settings.model_dump(),
                "script": self.script if script is None else script,
                "dictionary": self.dictionary,
                "batchText": self.batch["text"] if batch_text is None else batch_text,
                "cachePath": cache_preference,
                "device": self.models.mode,
            }
        )

    def snapshot(self, outputs_after: int = -1) -> dict:
        with self.lock:
            models = self.models.catalog()
            for model in models:
                if model["id"] == self.jobs.download_id:
                    model["progress"] = self.job["progress"]
            preview_bytes = sum(
                p.stat().st_size for p in self.storage.previews.iterdir() if p.is_file()
            )
            free_bytes = None
            if not self.setup_complete:
                try:
                    free_bytes = shutil.disk_usage(self.models.root).free
                except OSError:
                    pass
            return copy.deepcopy(
                {
                    "revision": self.revision,
                    "setup": {
                        "complete": self.setup_complete,
                        "resuming": self.setup_resuming,
                        "mediaReady": self.setup_media_ready() if not self.setup_complete else True,
                        "freeBytes": free_bytes,
                        "modelSizes": self.setup_model_sizes,
                    },
                    "settings": self.settings.model_dump(),
                    "script": self.script,
                    "documentRevision": self.document_revision,
                    "inspection": self.inspection,
                    "preview": self.preview,
                    "dictionary": self.dictionary,
                    "reference": self.reference,
                    "job": self.job,
                    "maintenance": self.maintenance_job,
                    "voices": self.voices,
                    "models": models,
                    "outputsRevision": self.outputs_revision,
                    **({"outputs": self.outputs} if outputs_after != self.outputs_revision else {}),
                    "units": self.units,
                    "batch": self.batch,
                    "configuration": {
                        "saved": self.saved_settings.model_dump(),
                        "preferences": {
                            "cachePath": str(self.models.root),
                            "tokenConfigured": bool(self.models.token)
                            or (self.storage.root / "download-credential.bin").is_file(),
                            "previewBytes": preview_bytes,
                            "logs": [*self.storage.recovery_warnings, *self.events],
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
                    "selectedOutput": self.selected_output,
                }
            )

    def dispatch(self, command: Command, outputs_after: int = -1) -> dict:
        with self.lock:
            self.status, self.status_is_error = None, False
            try:
                self._dispatch(command)
            except (ValueError, OSError, ValidationError) as error:
                self.status, self.status_is_error = str(error), True
            self.changed()
            return self.snapshot(outputs_after)

    def _dispatch(self, command: Command) -> None:
        kind = command.type
        if kind == "settings.update":
            patch = command.settings.model_dump(exclude_unset=True)
            if not patch:
                raise ValueError("Choose at least one setting to update.")
            settings = Settings.model_validate({**self.settings.model_dump(), **patch})
            self.persist(settings=settings)
            self.settings = settings
            self.inspection = None
            self.batch["reviewed"] = False
        elif kind == "script.update":
            self.persist(script=command.text)
            self.script, self.inspection = command.text, None
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
        elif kind == "maintenance.cancel":
            self.maintenance.cancel()
        elif kind == "setup.model-size":
            token, root = self.models.token, self.models.root

            def estimate():
                models = Models(root, self.maintenance)
                models.token = token
                self.maintenance.progress("preparing", 0, "Contacting the model host…")
                size = models.download_size(command.id)
                with self.lock:
                    self.maintenance.checkpoint()
                    if (root, token) == (self.models.root, self.models.token):
                        self.setup_model_sizes[command.id] = size
                        self.changed()

            self.maintenance.start("maintenance", "Check model download size", estimate)
        elif kind == "setup.finish":
            if self.setup_complete:
                return
            if (
                not self.preview
                or self.preview["id"] != command.id
                or self.job["kind"] != "preview"
                or self.job["phase"] != "complete"
                or self.setup_test != (self.job["id"], self.settings)
                or not self.library.media_path(command.id).is_file()
                or not self.setup_media_ready()
            ):
                raise ValueError("Generate a successful test clip before opening the studio.")
            self.persist(setup_complete=True)
            self.setup_complete = True
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
            self.status = "Temporary previews removed."
        elif kind == "diagnostics.refresh":
            self.maintenance.start("maintenance", "Refresh diagnostics", self.refresh_diagnostics)
        else:
            raise ValueError(f"Unsupported engine command: {kind}")

    def refresh_diagnostics(self) -> None:
        import httpx

        self.maintenance.progress("preparing", 0, "Checking the model host…")
        with self.lock:
            mode = self.models.mode
            root = self.models.root
        try:
            online = httpx.head("https://huggingface.co", timeout=5).is_success
        except httpx.HTTPError:
            online = False
        self.maintenance.checkpoint()
        models = Models(root, self.maintenance)
        models.mode = mode
        device = models.device()
        with self.lock:
            self.maintenance.checkpoint()
            self.online = online
            if self.models.mode == mode:
                self.device_info = device
            self.events.append(
                f"Device: {self.device_info['label']}. Model host reachable: {self.online}."
            )
            self.changed()

    @staticmethod
    def load_settings(values: object) -> Settings:
        return Settings.model_validate(migrate_settings(values))

    def effective_settings(self, script: str, settings: Settings | None = None) -> Settings:
        value = (settings or self.settings).model_copy()
        if value.auto_detect:
            value.language = text.detect_language(script, value.language)
        return value

    def start_job(self, kind: str) -> None:
        self.jobs.require_idle()
        if self.reference["status"] in {"recording", "validating", "error", "missing"}:
            raise ValueError("Finish or clear the voice reference before generating.")
        settings = self.settings.model_copy()
        dictionary = self.dictionary
        reference = self.reference_path or self.library.voice_paths.get(settings.voice)
        if self.reference_path is None and settings.voice != "default" and reference is None:
            raise ValueError("That voice is missing. Refresh the voice collection.")
        transcript = (
            "" if self.reference_path else self.library.voice_transcripts.get(settings.voice, "")
        )
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
                            transcript,
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
                    script, settings, dictionary, reference, voice, directory, transcript
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
                        if (
                            not self.setup_complete
                            and reference is None
                            and settings.voice == "default"
                        ):
                            self.setup_test = (self.job["id"], settings)
                    else:
                        self.accept_output(record)
                    self.changed()

        self.saved_settings = self.settings.model_copy()
        self.persist()
        self.jobs.start(kind, settings.title or kind.title(), work)

    def accept_output(self, record: dict) -> None:
        summary = self.library.summarize(record)
        self.library.records[record["id"]] = summary
        self.outputs.insert(0, summary)
        self.outputs_revision += 1
        self.selected_output = record["id"]
        self.changed()

    def batch_command(self, command: Command) -> None:
        self.jobs.require_idle()
        if command.type == "batch.source":
            self.batch["source"] = command.source
        elif command.type == "batch.text":
            self.persist(batch_text=command.text)
            self.batch["text"] = command.text
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
        if command.type == "voices.refresh":
            self.maintenance.start(
                "maintenance",
                "Refresh voice collection",
                lambda: self.refresh_voices(self.maintenance),
            )
            return
        self.jobs.require_idle()
        if command.type.startswith("voice.") or self.reference["status"] == "validating":
            self.maintenance.require_idle()
        if command.type == "reference.attach":
            if self.reference["status"] == "recording":
                self.start_reference_import(self.recorder.path, recording=True)
            else:
                if not self.recording_available:
                    raise ValueError(
                        "Microphone capture is unavailable. Upload a recording instead."
                    )
                self.recorder.start()
                self.pre_recording_reference = self.reference
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
            voice_id = self.library.save_voice(
                self.reference_path, command.label, command.transcript
            )
            path = self.storage.voices / f"{voice_id.removeprefix('custom:')}.wav"
            transcript = command.transcript.strip()
            self.library.voice_paths[voice_id] = path
            if transcript:
                self.library.voice_transcripts[voice_id] = transcript
            definition = self.library.voice_definition(
                voice_id,
                command.label.strip(),
                self.reference["duration"],
                custom=True,
                has_transcript=bool(transcript),
            )
            self.voices = [
                self.voices[0],
                *sorted(
                    [*self.voices[1:], definition],
                    key=lambda voice: self.library.voice_paths[voice["id"]],
                ),
            ]
            if transcript:
                self.reference_path.unlink(missing_ok=True)
                self.reference_path = None
                self.reference = {"status": "empty", "name": "", "duration": 0}
                self.settings.voice = voice_id
                self.persist()
            self.status = "Voice preset saved."
        elif command.type == "voice.delete":
            if not command.confirmed:
                raise ValueError("Confirm voice deletion first.")
            self.library.delete_voice(command.id)
            self.library.voice_paths.pop(command.id, None)
            self.library.voice_transcripts.pop(command.id, None)
            self.voices = [voice for voice in self.voices if voice["id"] != command.id]
            if self.settings.voice == command.id:
                self.settings.voice = "default"
                self.persist()

    def start_reference_import(self, path: Path, *, recording: bool = False) -> None:
        previous_state = self.reference
        name = "Microphone recording" if recording else path.name
        destination = self.storage.temporary / f"reference-{uuid4().hex}.wav"

        def convert():
            try:
                if recording:
                    self.recorder.finish()
                source = (
                    path
                    if recording
                    else selected_file(str(path), AUDIO_EXTENSIONS, MAX_AUDIO_IMPORT_BYTES)
                )
                self.maintenance.progress("preparing", 20, "Converting reference audio…")
                seconds = audio.reference_audio(source, destination, self.maintenance)
                with self.lock:
                    self.maintenance.checkpoint()
                    if self.reference_path:
                        self.reference_path.unlink(missing_ok=True)
                    self.reference_path = destination
                    self.reference = {"status": "ready", "name": name, "duration": seconds}
                    self.changed()
            except Exception as error:
                destination.unlink(missing_ok=True)
                with self.lock:
                    self.reference = previous_state
                    if recording and isinstance(error, Cancelled):
                        self.reference = self.pre_recording_reference
                    elif recording:
                        self.reference = {
                            "status": "error",
                            "name": name,
                            "duration": 0,
                            "message": str(error),
                        }
                    self.changed()
                raise
            finally:
                if recording:
                    path.unlink(missing_ok=True)

        self.maintenance.start("maintenance", "Check reference audio", convert)
        self.reference = {"status": "validating", "name": name, "duration": 0}

    def output_command(self, command: Command) -> None:
        if command.type == "output.select":
            self.library.output_path(command.id)
            self.selected_output = command.id
        elif command.type == "output.delete":
            self.jobs.require_idle()
            self.maintenance.require_idle()
            if not command.confirmed:
                raise ValueError("Confirm narration deletion first.")
            self.library.delete(command.id)
            self.outputs = [record for record in self.outputs if record["id"] != command.id]
            self.outputs_revision += 1
            if self.selected_output == command.id:
                self.selected_output = self.outputs[0]["id"] if self.outputs else None
        elif command.type == "outputs.refresh":
            self.maintenance.start(
                "maintenance",
                "Refresh audio library",
                lambda: self.refresh_outputs(self.maintenance),
            )
        elif command.type == "output.watermark":
            path = self.library.output_path(command.id)

            def check():
                self.jobs.progress("preparing", 0, "Preparing the opening audio excerpt…")
                if self.models.model is not None:
                    self.models.release()
                score = watermark.verify(path, self.storage.temporary, self.jobs)
                with self.lock:
                    self.jobs.checkpoint()
                    self.watermark = {
                        "outputId": command.id,
                        "state": "detected" if score >= 0.5 else "not-detected",
                        "score": score,
                        "message": (
                            f"Checked up to the first {watermark.WINDOW_SECONDS} seconds. "
                            f"Score: {score:.3f}. Re-encoding may affect detection."
                        ),
                    }
                    self.changed()

            self.jobs.start("watermark", "Check audio watermark", check)
            self.watermark = None

    def desktop(self, operation: DesktopOperation, outputs_after: int = -1) -> dict:
        with self.lock:
            kind = operation.operation
            if kind in {"storage.choose", "reference.import", "project.open", "batch.import"}:
                self.jobs.require_idle()
            paths = operation.paths
            if kind == "credential.restore":
                self.models.token = operation.token
            elif kind == "storage.choose":
                try:
                    path = prepare_model_root(Path(paths[0]))
                except (OSError, ValueError, RuntimeError) as error:
                    raise ValueError("Choose a writable model folder.") from error
                self.persist(cache_path=path)
                self.models.release()
                # Selecting a folder switches caches; it never moves or deletes the old one.
                self.models.root = path
                self.storage.model_root = path
                self.status = (
                    "Model folder changed. Existing downloads remain in the previous folder."
                )
            elif kind == "reference.import":
                if self.reference["status"] == "recording":
                    raise ValueError("Finish or clear the microphone capture before importing.")
                self.start_reference_import(Path(paths[0]))
            elif kind == "script.import":
                path = selected_file(paths[0], SCRIPT_EXTENSIONS)
                self.script = text.read_script(path)
                self.inspection = None
                self.document_revision += 1
                self.persist()
                self.status = f"Loaded {path.name}."
            elif kind == "batch.import":
                new_files = []
                new_scripts = {}
                for raw in paths:
                    path = selected_file(raw, SCRIPT_EXTENSIONS)
                    try:
                        content = text.read_script(path)
                    except UnicodeDecodeError:
                        raise ValueError(f"{path.name} is not a UTF-8 script.") from None
                    unit_id = uuid4().hex
                    new_scripts[unit_id] = (path.stem, content)
                    new_files.append(
                        {
                            "id": unit_id,
                            "name": path.name,
                            "characters": len(content),
                            "readable": True,
                        }
                    )
                self.batch_files.update(new_scripts)
                self.batch["files"].extend(new_files)
                self.batch["reviewed"] = False
                self.units = []
                self.unit_texts = {}
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
                settings = self.load_settings(data["settings"])
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
                self.start_export(operation, Path(paths[0]))
            if kind != "credential.restore":
                self.status_is_error = False
            self.changed()
            return self.snapshot(outputs_after)

    def start_export(self, operation: DesktopOperation, destination: Path) -> None:
        archive = operation.format == "zip"
        if operation.id == "batch" and archive:
            ids = [unit["outputId"] for unit in self.units if unit["status"] == "complete"]
            if not ids:
                raise ValueError("No completed batch items are available.")
        else:
            ids = [operation.id]

        def publish(staging: Path) -> None:
            with self.lock:
                self.maintenance.checkpoint()
                staging.replace(destination)

        def export():
            self.maintenance.progress("preparing", 0, "Writing the export…")
            sources = []
            for output_id in ids:
                self.maintenance.checkpoint()
                sources.extend(self.library.export_sources(output_id, operation.format))
            export_files(
                sources, destination, archive=archive, jobs=self.maintenance, publish=publish
            )

        self.maintenance.start("maintenance", "Export audio files", export)

    def close(self) -> None:
        with self.lock:
            self.maintenance.close()
            self.jobs.close()
            self.recorder.close()
