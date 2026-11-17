import subprocess
import sys
import threading
import unittest
import wave
from pathlib import Path
from tempfile import TemporaryDirectory
from unittest.mock import patch

import soundfile as sf
from phonivra_engine import watermark
from phonivra_engine.audio import media_binary
from phonivra_engine.jobs import Jobs


@unittest.skipUnless(media_binary("ffmpeg"), "FFmpeg is required")
class WatermarkTests(unittest.TestCase):
    def setUp(self):
        directory = TemporaryDirectory()
        self.addCleanup(directory.cleanup)
        self.root = Path(directory.name)
        self.source = self.root / "narration.wav"
        with wave.open(str(self.source), "wb") as recording:
            recording.setparams((1, 2, 8_000, 0, "NONE", ""))
            recording.writeframes(b"\x00\x00" * 8_000 * 60)

    def test_detector_receives_only_a_bounded_mono_excerpt(self):
        popen = subprocess.Popen

        def inspect(args, **kwargs):
            if args[0] == sys.executable:
                excerpt = sf.info(args[-2])
                self.assertEqual(excerpt.channels, 1)
                self.assertEqual(excerpt.samplerate, watermark.SAMPLE_RATE)
                self.assertEqual(excerpt.frames, watermark.WINDOW_SECONDS * watermark.SAMPLE_RATE)
                Path(args[-1]).write_text("1.0", encoding="ascii")
                args = [sys.executable, "-c", "pass"]
            return popen(args, **kwargs)

        jobs = Jobs(lambda **_: None)
        self.addCleanup(jobs.close)
        with patch.object(watermark.subprocess, "Popen", side_effect=inspect):
            self.assertEqual(watermark.verify(self.source, self.root, jobs), 1)
        self.assertEqual(list(self.root.iterdir()), [self.source])

    def test_stop_kills_and_reaps_the_detector(self):
        popen = subprocess.Popen
        started = threading.Event()
        detector = None
        updates = []

        def stall(args, **kwargs):
            nonlocal detector
            if args[0] != sys.executable:
                return popen(args, **kwargs)
            detector = popen([sys.executable, "-c", "import time; time.sleep(120)"], **kwargs)
            started.set()
            return detector

        jobs = Jobs(lambda **fields: updates.append(fields["phase"]))
        self.addCleanup(jobs.close)
        with patch.object(watermark.subprocess, "Popen", side_effect=stall):
            jobs.start(
                "preview", "Check watermark", lambda: watermark.verify(self.source, self.root, jobs)
            )
            self.assertTrue(started.wait(5))
            jobs.cancel()
            jobs.future.result(timeout=2)
        self.assertEqual(updates[-1], "stopped")
        self.assertIsNotNone(detector.poll())
        self.assertEqual(list(self.root.iterdir()), [self.source])
