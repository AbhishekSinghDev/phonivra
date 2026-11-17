import threading
import unittest
import wave
from pathlib import Path
from tempfile import TemporaryDirectory
from unittest.mock import patch

from phonivra_engine import audio
from phonivra_engine.library import export_files
from phonivra_engine.schemas import DesktopOperation, ModelCommand, SimpleCommand
from phonivra_engine.studio import Studio


class StudioResponsivenessTests(unittest.TestCase):
    def setUp(self):
        directory = TemporaryDirectory()
        self.addCleanup(directory.cleanup)
        self.root = Path(directory.name)

    def make_audio(self, name):
        folder = self.root / "outputs"
        folder.mkdir(exist_ok=True)
        path = folder / name
        with wave.open(str(path), "wb") as recording:
            recording.setparams((1, 2, 8_000, 0, "NONE", ""))
            recording.writeframes(b"\0\0" * 8_000)

    def test_snapshots_are_available_before_slow_discovery_finishes(self):
        for index in range(3):
            self.make_audio(f"entry-{index}.wav")
        studio = Studio(self.root, defer_discovery=True)
        self.addCleanup(studio.close)
        entered = threading.Event()
        released = threading.Event()
        inspected = []
        duration = audio.duration

        def inspect(path, jobs=None):
            entered.set()
            self.assertTrue(released.wait(5))
            inspected.append(path)
            return duration(path, jobs)

        with patch.object(audio, "duration", side_effect=inspect):
            studio.start_discovery()
            try:
                self.assertTrue(entered.wait(2))
                snapshot = studio.snapshot()
                self.assertEqual(snapshot["maintenance"]["phase"], "preparing")
                self.assertEqual(snapshot["outputs"], [])
                stopped = studio.dispatch(SimpleCommand(type="maintenance.cancel"))
                self.assertEqual(stopped["maintenance"]["phase"], "stopping")
            finally:
                released.set()
                studio.maintenance.future.result(timeout=2)
        self.assertEqual(studio.snapshot()["maintenance"]["phase"], "stopped")
        self.assertEqual(len(inspected), 1)

    def test_model_size_request_cannot_block_stopping_synthesis(self):
        studio = Studio(self.root)
        self.addCleanup(studio.close)
        entered = threading.Event()
        released = threading.Event()

        def estimate(_):
            entered.set()
            self.assertTrue(released.wait(5))
            return 100

        def synthesize():
            while not studio.jobs.cancelled.wait(0.01):
                studio.jobs.checkpoint()
            studio.jobs.checkpoint()

        studio.jobs.start("narration", "Test generation", synthesize)
        with patch("phonivra_engine.models.Models.download_size", side_effect=estimate):
            try:
                studio.dispatch(ModelCommand(type="setup.model-size", id="multilingual"))
                self.assertTrue(entered.wait(2))
                studio.dispatch(SimpleCommand(type="job.cancel"))
                studio.jobs.future.result(timeout=1)
                self.assertEqual(studio.snapshot()["job"]["phase"], "stopped")
                self.assertFalse(released.is_set())
            finally:
                released.set()
                studio.maintenance.future.result(timeout=2)
        self.assertEqual(studio.snapshot()["setup"]["modelSizes"]["multilingual"], 100)

    def test_cancelled_zip_export_preserves_destination_and_discards_staging(self):
        self.make_audio("entry.wav")
        studio = Studio(self.root)
        self.addCleanup(studio.close)
        entered = threading.Event()
        released = threading.Event()
        destination = self.root / "export.zip"
        destination.write_bytes(b"previous content")

        def stall(*args, publish, **kwargs):
            def before_publish(staging):
                self.assertTrue(staging.is_file())
                entered.set()
                self.assertTrue(released.wait(5))
                publish(staging)

            export_files(*args, publish=before_publish, **kwargs)

        with patch("phonivra_engine.studio.export_files", side_effect=stall):
            try:
                studio.desktop(
                    DesktopOperation(
                        operation="output.export",
                        paths=[str(destination)],
                        format="zip",
                        id=studio.outputs[0]["id"],
                    )
                )
                self.assertTrue(entered.wait(2))
                snapshot = studio.dispatch(SimpleCommand(type="maintenance.cancel"))
                self.assertEqual(snapshot["maintenance"]["phase"], "stopping")
            finally:
                released.set()
                studio.maintenance.future.result(timeout=2)
        self.assertEqual(studio.snapshot()["maintenance"]["phase"], "stopped")
        self.assertEqual(destination.read_bytes(), b"previous content")
        self.assertEqual(list(self.root.glob(".phonivra-export-*")), [])
