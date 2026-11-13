"""Validated input contracts. Desktop-only paths never come from the renderer."""

from typing import Annotated, Literal

from pydantic import BaseModel, ConfigDict, Field, field_validator

from .contract import (
    DEVICE_MODES,
    INDIC_LANGUAGES,
    MAX_REFERENCE_TRANSCRIPT_LENGTH,
    MAX_TEXT_LENGTH,
    NATIVE_SAMPLE_RATE,
    SAMPLE_RATES,
)

ModelId = Literal["turbo", "multilingual", "indicf5"]
ModelSelection = Literal["auto", "turbo", "multilingual", "indicf5"]
RecordedModel = Literal["auto", "turbo", "multilingual", "indicf5", "nano", "original"]
Language = Literal[
    "as",
    "bn",
    "gu",
    "kn",
    "ml",
    "mr",
    "or",
    "pa",
    "ta",
    "te",
    "ar",
    "da",
    "de",
    "el",
    "en",
    "es",
    "fi",
    "fr",
    "he",
    "hi",
    "it",
    "ja",
    "ko",
    "ms",
    "nl",
    "no",
    "pl",
    "pt",
    "ru",
    "sv",
    "sw",
    "tr",
    "zh",
]


class Input(BaseModel):
    model_config = ConfigDict(extra="forbid", allow_inf_nan=False, strict=True)


class Settings(Input):
    title: str = Field(default="", max_length=120)
    language: Language = "en"
    model: ModelSelection = "auto"
    auto_detect: bool = False
    voice: str = Field(default="default", max_length=256)
    temperature: float = Field(default=0.8, ge=0.1, le=1.5)
    top_p: float = Field(default=0.95, ge=0, le=1)
    top_k: int = Field(default=1000, ge=0, le=2000)
    min_p: float = Field(default=0.05, ge=0, le=0.5)
    repetition_penalty: float = Field(default=1.2, ge=1, le=2)
    exaggeration: float = Field(default=0.5, ge=0, le=1)
    cfg_weight: float = Field(default=0.5, ge=0, le=1)
    chunk_limit: int = Field(default=260, ge=60, le=500)
    gap: float = Field(default=0.38, ge=0, le=3)
    seed: int = Field(default=0, ge=0, le=2147483647)
    speed: float = Field(default=1, ge=0.5, le=2)
    format: Literal["wav", "mp3", "flac", "ogg", "m4a"] = "wav"
    sample_rate: int = NATIVE_SAMPLE_RATE

    @field_validator("sample_rate")
    @classmethod
    def supported_sample_rate(cls, value: int) -> int:
        if value not in SAMPLE_RATES:
            raise ValueError("Unsupported sample rate.")
        return value

    loudness: bool = True
    loudness_target: float = Field(default=-16, ge=-24, le=-9)
    trim_silence: bool = True
    fade_ms: int = Field(default=30, ge=0, le=1000)
    normalize_punct: bool = False
    convert_numbers: bool = False
    expand_abbrevs: bool = False
    strip_markdown: bool = True
    remove_emoji: bool = True
    pronounce: bool = False


def resolve_model(settings: Settings) -> ModelId:
    if settings.model == "auto":
        return "indicf5" if settings.language in INDIC_LANGUAGES - {"hi"} else "multilingual"
    return settings.model


class SimpleCommand(Input):
    type: Literal[
        "script.inspect",
        "status.dismiss",
        "job.cancel",
        "batch.prepare",
        "batch.start",
        "preferences.save",
        "previews.clear",
        "diagnostics.refresh",
        "reference.clear",
        "voices.refresh",
        "outputs.refresh",
        "settings.restore",
        "credentials.remove",
    ]


class TextCommand(Input):
    type: Literal["script.update", "batch.text", "dictionary.save"]
    text: str = Field(max_length=MAX_TEXT_LENGTH)


class SettingsCommand(Input):
    type: Literal["settings.update"]
    settings: Settings


class JobCommand(Input):
    type: Literal["job.start"]
    kind: Literal["narration", "preview", "batch"]


class IdCommand(Input):
    type: Literal["output.select", "output.watermark", "batch.remove-file", "setup.finish"]
    id: str = Field(min_length=1, max_length=256)


class DeleteCommand(Input):
    type: Literal["voice.delete", "output.delete"]
    id: str = Field(min_length=1, max_length=256)
    confirmed: bool


class ModelCommand(Input):
    type: Literal["model.download", "setup.model-size"]
    id: ModelId


class ModelRemove(Input):
    type: Literal["model.remove"]
    id: ModelId
    confirmed: bool


class ModelPause(Input):
    type: Literal["model.pause"]
    id: ModelId
    paused: bool


class BatchSource(Input):
    type: Literal["batch.source"]
    source: Literal["files", "text"]


class BatchSplit(Input):
    type: Literal["batch.split"]
    enabled: bool


class DeviceCommand(Input):
    type: Literal["device.set"]
    mode: str

    @field_validator("mode")
    @classmethod
    def supported_mode(cls, value: str) -> str:
        if value not in DEVICE_MODES:
            raise ValueError("Unsupported generation device.")
        return value


class ReferenceCommand(Input):
    type: Literal["reference.attach"]
    source: Literal["record", "upload"]


class VoiceSave(Input):
    type: Literal["voice.save"]
    label: str = Field(min_length=1, max_length=60)
    transcript: str = Field(default="", max_length=MAX_REFERENCE_TRANSCRIPT_LENGTH)


class CredentialCommand(Input):
    type: Literal["credentials.set"]
    token: str = Field(min_length=1, max_length=4096)


Command = Annotated[
    SimpleCommand
    | TextCommand
    | SettingsCommand
    | JobCommand
    | IdCommand
    | DeleteCommand
    | ModelCommand
    | ModelRemove
    | ModelPause
    | BatchSource
    | BatchSplit
    | DeviceCommand
    | ReferenceCommand
    | VoiceSave
    | CredentialCommand,
    Field(discriminator="type"),
]


class DesktopOperation(Input):
    operation: Literal[
        "script.import",
        "batch.import",
        "reference.import",
        "project.open",
        "project.save",
        "output.export",
        "storage.choose",
        "credential.restore",
    ]
    paths: list[str] = Field(default_factory=list, max_length=100)
    id: str | None = Field(default=None, max_length=256)
    format: Literal["audio", "srt", "vtt", "txt", "json", "zip"] = "audio"
    token: str | None = Field(default=None, max_length=4096)


class PartRecord(Input):
    id: str
    index: int = Field(ge=1)
    text: str
    duration: float = Field(ge=0)
    pause: float = Field(ge=0)


class RecordedSettings(Settings):
    model: RecordedModel = "auto"


class OutputRecord(Input):
    """Persisted output schema; validate sidecars before presenting them to the desktop."""

    id: str = Field(min_length=1, max_length=256)
    title: str
    filename: str
    duration: float = Field(ge=0)
    created: str
    format: Literal["wav", "mp3", "flac", "ogg", "m4a", "opus", "aiff", "aif"]
    sampleRate: int = Field(gt=0)
    language: Language | None
    model: RecordedModel | None
    voice: str | None
    seed: int | None
    loudnessGain: float | None
    requestedModel: RecordedModel | None
    sourceCharacters: int | None
    speed: float | None
    trimStart: float | None
    settingsSnapshot: RecordedSettings | None
    metadataAvailable: bool
    external: bool
    companions: list[Literal["srt", "vtt", "txt", "json"]] = Field(default_factory=list)
    parts: list[PartRecord]

    @field_validator("filename")
    @classmethod
    def filename_is_basename(cls, value: str) -> str:
        if not value or "/" in value or "\\" in value or value in {".", ".."}:
            raise ValueError("Invalid library filename.")
        return value
