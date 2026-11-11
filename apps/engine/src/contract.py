"""Protocol and input limits shared with the Electron client."""

import json
from importlib.resources import files

_contract = json.loads(files(__package__).joinpath("contract.json").read_text(encoding="utf-8"))
PROTOCOL_VERSION = _contract["protocolVersion"]
LOOPBACK_HOST = _contract["loopbackHost"]
MAX_TEXT_LENGTH = _contract["maxTextLength"]
MAX_AUDIO_IMPORT_BYTES = _contract["maxAudioImportBytes"]
MAX_REQUEST_BYTES = _contract["maxRequestBytes"]
SCRIPT_EXTENSIONS = {"." + extension for extension in _contract["scriptExtensions"]}
AUDIO_EXTENSIONS = {"." + extension for extension in _contract["audioExtensions"]}
DEVICE_MODES = tuple(_contract["deviceModes"])
SAMPLE_RATES = tuple(_contract["sampleRates"])
NATIVE_SAMPLE_RATE = _contract["nativeSampleRate"]
MAX_RECORDING_SECONDS = _contract["maxRecordingSeconds"]
