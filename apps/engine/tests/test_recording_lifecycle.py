import subprocess
import sys
import threading
import time
import unittest
from contextlib import closing
from pathlib import Path
from tempfile import TemporaryDirectory
from unittest.mock import patch

from phonivra_engine.audio import media_binary
from phonivra_engine.recording import Recorder
from phonivra_engine.schemas import ReferenceCommand
from phonivra_engine.studio import Studio

CAPTURE = r"""
import sys
import wave
with wave.open(sys.argv[1], "wb") as output:
    output.setparams((1, 2, 8000, 0, "NONE", ""))
    output.writeframes(b"\0\0" * 8000 * 6)
if sys.argv[2] == "manual":
    sys.stdin.readline()
"""


class RecordingLifecycleTests(unittest.TestCase):
    def wait_for_status(self, studio, status):
        deadline = time.monotonic() + 5
        while time.monotonic() < deadline:
            reference = studio.snapshot()["reference"]
            if reference["status"] == status:
                return reference
            time.sleep(0.02)
        self.fail(f"Reference never reached {status}: {reference}")

    def capture(self, studio, source, mode):
        popen = subprocess.Popen

        def spawn(args, **kwargs):
            if args[-1] == str(studio.recorder.path):
                args = [sys.executable, "-c", source, str(studio.recorder.path), mode]
            return popen(args, **kwargs)

        studio.recording_available = True
        with (
            patch.object(Recorder, "input_format", return_value="pulse"),
            patch("phonivra_engine.recording.media_binary", return_value=sys.executable),
            patch.object(subprocess, "Popen", side_effect=spawn),
        ):
            studio.dispatch(ReferenceCommand(type="reference.attach", source="record"))

    @unittest.skipUnless(media_binary("ffmpeg"), "FFmpeg is required")
    def test_natural_exit_and_manual_finish_each_convert_once(self):
        for mode in ("automatic", "manual"):
            with (
                self.subTest(mode=mode),
                TemporaryDirectory() as directory,
                closing(Studio(Path(directory))) as studio,
                patch.object(studio.recorder, "finish", wraps=studio.recorder.finish) as finish,
            ):
                self.capture(studio, CAPTURE, mode)
                if mode == "manual":
                    studio.dispatch(ReferenceCommand(type="reference.attach", source="upload"))
                reference = self.wait_for_status(studio, "ready")
                studio.maintenance.future.result(timeout=2)
                self.assertEqual(reference["duration"], 6)
                self.assertTrue(studio.reference_path.is_file())
                self.assertFalse(studio.recorder.path.exists())
                finish.assert_called_once()

    def test_early_device_failure_leaves_recording_state_even_during_other_maintenance(self):
        with TemporaryDirectory() as directory, closing(Studio(Path(directory))) as studio:
            released = threading.Event()
            studio.maintenance.start("maintenance", "Fixture", lambda: released.wait(5))
            try:
                self.capture(studio, 'import sys; sys.exit("Microphone unavailable")', "error")
                reference = self.wait_for_status(studio, "error")
                self.assertIn("Microphone unavailable", reference["message"])
                self.assertTrue(studio.maintenance.busy)
                self.assertIsNone(studio.recorder.process)
            finally:
                released.set()
                studio.maintenance.future.result(timeout=2)
