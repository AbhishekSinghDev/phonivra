import tempfile
import threading
import unittest
import wave
from contextlib import closing
from pathlib import Path
from unittest.mock import patch

from phonivra_engine.audio import media_binary
from phonivra_engine.schemas import DesktopOperation, JobCommand
from phonivra_engine.storage import Storage, lock_workspace
from phonivra_engine.studio import Studio


class TemporaryAudioCleanupTests(unittest.TestCase):
    def test_active_reference_is_removed_after_its_job_stops(self):
        with tempfile.TemporaryDirectory() as directory, closing(Studio(Path(directory))) as studio:
            reference = studio.storage.temporary / ("reference-" + "a" * 32 + ".wav")
            reference.write_bytes(b"temporary audio")
            studio.reference_path = reference
            finished = threading.Event()
            studio.jobs.start("narration", "Test", lambda: finished.wait(5))
            try:
                studio.close()
                self.assertTrue(reference.exists())
            finally:
                finished.set()
                # A future's done callbacks run just after it transitions to done.
                studio.jobs.pool.shutdown(wait=True)
            self.assertFalse(reference.exists())

    @unittest.skipUnless(media_binary("ffmpeg"), "FFmpeg is required")
    def test_orderly_close_removes_attached_reference_but_preserves_original(self):
        with tempfile.TemporaryDirectory() as directory:
            with closing(Studio(Path(directory))) as studio:
                original = Path(directory) / "original.wav"
                with wave.open(str(original), "wb") as audio:
                    audio.setparams((1, 2, 8_000, 0, "NONE", ""))
                    audio.writeframes(b"\0\0" * 8_000 * 6)
                studio.desktop(
                    DesktopOperation(operation="reference.import", paths=[str(original)])
                )
                studio.maintenance.future.result(timeout=5)
                reference = studio.reference_path
                self.assertTrue(reference.is_file())
            self.assertFalse(reference.exists())
            self.assertTrue(original.is_file())

    def test_locked_sweep_removes_only_app_owned_audio_artifacts(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            storage = Storage(root)
            stale = storage.temporary / ("reference-" + "b" * 32 + ".wav")
            microphone = storage.temporary / "microphone.wav"
            render = Path(tempfile.mkdtemp(prefix=".render-", dir=storage.outputs))
            preview = Path(tempfile.mkdtemp(prefix=".render-", dir=storage.previews))
            (render / "raw.wav").touch()
            (preview / "master.wav").touch()
            kept = [
                storage.outputs / stale.name,
                storage.voices / stale.name,
                storage.previews / "saved-preview.wav",
                storage.temporary / "reference-not-owned.wav",
            ]
            for file in [stale, microphone, kept[-1]]:
                file.write_bytes(b"fixture")
            for file in kept[:-1]:
                with wave.open(str(file), "wb") as audio:
                    audio.setparams((1, 2, 8_000, 0, "NONE", ""))
                    audio.writeframes(b"\0\0" * 8_000)
            unowned = storage.outputs / ".render-owned-by-user"
            unowned.mkdir()

            with lock_workspace(root):
                with self.assertRaisesRegex(OSError, "Could not lock the workspace"):
                    lock_workspace(root).close()
                with closing(Studio(root, defer_discovery=True)) as studio:
                    studio.start_discovery(clean_stale_audio=True)
                    studio.maintenance.future.result(timeout=5)
            self.assertTrue(all(not path.exists() for path in [stale, microphone, render, preview]))
            self.assertTrue(all(path.is_file() for path in kept))
            self.assertTrue(unowned.is_dir())
            with lock_workspace(root):
                pass

    def test_startup_sweep_cannot_remove_a_live_render(self):
        with (
            tempfile.TemporaryDirectory() as directory,
            closing(Studio(Path(directory), defer_discovery=True)) as studio,
        ):
            entered = threading.Event()
            released = threading.Event()

            def sweep(_checkpoint):
                entered.set()
                self.assertTrue(released.wait(5))

            with (
                lock_workspace(studio.storage.root),
                patch.object(studio.storage, "cleanup_stale_audio", side_effect=sweep),
            ):
                studio.start_discovery(clean_stale_audio=True)
                try:
                    self.assertTrue(entered.wait(2))
                    state = studio.dispatch(JobCommand(type="job.start", kind="preview"))
                    self.assertTrue(state["statusIsError"])
                    self.assertIn("Wait for temporary audio cleanup", state["status"])
                    self.assertEqual(state["job"]["phase"], "idle")
                finally:
                    released.set()
                    studio.maintenance.future.result(timeout=2)
