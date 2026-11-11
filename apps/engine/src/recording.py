"""Native microphone capture without granting browser device permissions."""

import re
import subprocess
import sys
import tempfile
from contextlib import ExitStack, contextmanager
from pathlib import Path

from .audio import MEDIA_CREATION_FLAGS, media_binary
from .contract import MAX_RECORDING_SECONDS, NATIVE_SAMPLE_RATE


@contextmanager
def capture_log():
    with tempfile.TemporaryFile() as errors:
        yield errors


class Recorder:
    def __init__(self, temporary: Path):
        self.path = temporary / "microphone.wav"
        self.process: subprocess.Popen | None = None
        self.errors = None
        self.resources = ExitStack()

    @staticmethod
    def input_format() -> str | None:
        return {"linux": "pulse", "darwin": "avfoundation", "win32": "dshow"}.get(sys.platform)

    def available(self) -> bool:
        binary, driver = media_binary("ffmpeg"), self.input_format()
        if not binary or not driver:
            return False
        try:
            result = subprocess.run(
                [binary, "-hide_banner", "-devices"],
                capture_output=True,
                text=True,
                errors="replace",
                timeout=3,
                check=True,
                creationflags=MEDIA_CREATION_FLAGS,
            )
        except (OSError, subprocess.SubprocessError):
            return False
        return any(
            re.match(rf"^\s*D[ E]\s+{driver}\s", line) for line in result.stdout.splitlines()
        )

    def start(self) -> None:
        binary, driver = media_binary("ffmpeg"), self.input_format()
        if not binary or not driver:
            raise ValueError("Microphone capture is unavailable. Upload a recording instead.")
        if self.process:
            raise ValueError("A recording is already running.")
        device = "default" if driver == "pulse" else ":default"
        if driver == "dshow":
            try:
                result = subprocess.run(
                    [binary, "-hide_banner", "-list_devices", "true", "-f", driver, "-i", "dummy"],
                    capture_output=True,
                    text=True,
                    errors="replace",
                    timeout=5,
                    check=False,
                    creationflags=MEDIA_CREATION_FLAGS,
                )
            except (OSError, subprocess.SubprocessError):
                raise ValueError("Could not find an available microphone.") from None
            microphone = re.search(r'^.*?"([^"\r\n]+)" \(audio\)\s*$', result.stderr, re.MULTILINE)
            if not microphone:
                raise ValueError("No microphone was found. Upload a recording instead.")
            device = f"audio={microphone[1]}"
        self.errors = self.resources.enter_context(capture_log())
        try:
            self.process = subprocess.Popen(
                [
                    binary,
                    "-y",
                    "-hide_banner",
                    "-loglevel",
                    "error",
                    "-f",
                    driver,
                    "-i",
                    device,
                    "-vn",
                    "-t",
                    str(MAX_RECORDING_SECONDS),
                    "-ac",
                    "1",
                    "-ar",
                    str(NATIVE_SAMPLE_RATE),
                    "-c:a",
                    "pcm_s16le",
                    str(self.path),
                ],
                stdin=subprocess.PIPE,
                stdout=subprocess.DEVNULL,
                stderr=self.errors,
                creationflags=MEDIA_CREATION_FLAGS,
            )
        except OSError:
            self.resources.close()
            self.errors = None
            raise

    def finish(self) -> Path:
        if not self.process:
            raise ValueError("There is no active recording.")
        process, self.process = self.process, None
        try:
            if process.poll() is None:
                process.communicate(input=b"q\n", timeout=5)
            if process.returncode:
                self.errors.seek(0)
                raise ValueError(
                    self.errors.read(3000).decode(errors="replace")
                    or "Microphone capture failed. Check your system input device."
                )
            return self.path
        except subprocess.TimeoutExpired:
            process.kill()
            process.wait()
            raise ValueError("The microphone did not stop correctly.") from None
        finally:
            self.resources.close()
            self.errors = None

    def close(self) -> None:
        if self.process:
            self.process.kill()
            self.process.wait()
            self.process = None
        if self.errors:
            self.resources.close()
            self.errors = None
        self.path.unlink(missing_ok=True)
