import json
import unittest
import wave
from pathlib import Path
from tempfile import TemporaryDirectory
from unittest.mock import patch

from phonivra_engine.schemas import DesktopOperation, TextCommand
from phonivra_engine.studio import Studio


class StartupRecoveryTests(unittest.TestCase):
    def start(self, root: Path) -> Studio:
        studio = Studio(root)
        self.addCleanup(studio.close)
        return studio

    def test_invalid_workspace_starts_and_preserves_original(self):
        for original in (b'{"script":', b"[]", b"\xff", b'{"version":2,"script":"future data"}'):
            with self.subTest(original=original), TemporaryDirectory() as directory:
                root = Path(directory)
                workspace = root / "workspace.json"
                workspace.write_bytes(original)
                studio = self.start(root)

                self.assertTrue(studio.snapshot()["statusIsError"])
                self.assertEqual(studio.snapshot()["script"], "")
                (backup,) = root.glob("workspace.recovery-*.json")
                self.assertEqual(backup.read_bytes(), original)
                saved = studio.dispatch(TextCommand(type="script.update", text="New draft"))
                self.assertFalse(saved["statusIsError"])
                restarted = self.start(root)
                self.assertEqual(restarted.script, "New draft")
                self.assertIsNone(restarted.snapshot()["status"])
                self.assertEqual(list(root.glob("workspace.recovery-*.json")), [backup])

    def test_workspace_recovers_valid_fields_and_keeps_startup_warning(self):
        with TemporaryDirectory() as directory:
            root = Path(directory)
            workspace = root / "workspace.json"
            original = {
                "settings": {"title": "Narration", "speed": None, "model": "original"},
                "savedSettings": {"speed": 1.5, "language": False},
                "script": "Keep this draft",
                "dictionary": "a=b",
                "batchText": "Keep this batch",
                "setupComplete": True,
            }
            workspace.write_text(json.dumps(original), encoding="utf-8")
            studio = self.start(root)
            snapshot = studio.desktop(DesktopOperation(operation="credential.restore", token=None))

            self.assertTrue(snapshot["statusIsError"])
            self.assertIn("Recovered workspace.json", snapshot["status"])
            self.assertTrue(snapshot["setup"]["complete"])
            self.assertEqual(snapshot["script"], original["script"])
            self.assertEqual(snapshot["dictionary"], original["dictionary"])
            self.assertEqual(snapshot["batch"]["text"], original["batchText"])
            self.assertEqual(snapshot["settings"]["title"], "Narration")
            self.assertEqual(snapshot["settings"]["model"], "auto")
            self.assertEqual(snapshot["settings"]["speed"], 1)
            self.assertEqual(snapshot["configuration"]["saved"]["speed"], 1.5)

    def test_voice_registry_recovers_without_moving_recordings(self):
        for original in (b"{", b"[]", b'{"sample.wav":{"label":12,"transcript":"Hello"}}'):
            with self.subTest(original=original), TemporaryDirectory() as directory:
                root = Path(directory)
                voices = root / "voices"
                voices.mkdir()
                recording = voices / "sample.wav"
                with wave.open(str(recording), "wb") as wav:
                    wav.setparams((1, 2, 8000, 8000, "NONE", "not compressed"))
                    wav.writeframes(bytes(16000))
                audio = recording.read_bytes()
                registry = voices / "registry.json"
                registry.write_bytes(original)
                studio = self.start(root)
                snapshot = studio.snapshot()

                self.assertIn("Recovered voices/registry.json", snapshot["status"])
                self.assertEqual(snapshot["voices"][1]["label"], "sample")
                self.assertEqual(snapshot["voices"][1]["hasTranscript"], b"Hello" in original)
                (backup,) = voices.glob("registry.recovery-*.json")
                self.assertEqual(backup.read_bytes(), original)
                new_voice = studio.library.save_voice(recording, "New voice", "Test")
                restarted = self.start(root)
                self.assertIn(new_voice, restarted.library.voice_paths)
                self.assertEqual(recording.read_bytes(), audio)
                self.assertIsNone(restarted.snapshot()["status"])

    def test_saved_cache_falls_back_and_replacement_survives_restart(self):
        with TemporaryDirectory() as directory:
            root = Path(directory)
            saved_cache = root / "old-cache"
            saved_cache.write_bytes(b"keep old file")
            state = root / "workspace.json"
            state.write_text(json.dumps({"cachePath": str(saved_cache)}), encoding="utf-8")
            studio = self.start(root)
            self.assertEqual(studio.models.root, root / "models")
            self.assertIn("saved model folder is unavailable", studio.snapshot()["status"])
            studio.dispatch(TextCommand(type="script.update", text="New draft"))
            self.assertEqual(
                json.loads(state.read_text(encoding="utf-8"))["cachePath"], str(saved_cache)
            )

            replacement = root / "replacement"
            studio.desktop(DesktopOperation(operation="storage.choose", paths=[str(replacement)]))
            restarted = self.start(root)
            self.assertEqual(restarted.models.root, replacement)
            self.assertIsNone(restarted.snapshot()["status"])
            self.assertEqual(saved_cache.read_bytes(), b"keep old file")

    def test_blocked_default_cache_still_allows_a_replacement(self):
        with TemporaryDirectory() as directory:
            root = Path(directory)
            default = root / "models"
            default.write_bytes(b"keep default file")
            studio = self.start(root)
            self.assertIn("default model folder is unavailable", studio.snapshot()["status"])
            replacement = root / "replacement"
            snapshot = studio.desktop(
                DesktopOperation(operation="storage.choose", paths=[str(replacement)])
            )
            self.assertEqual(
                snapshot["configuration"]["preferences"]["cachePath"], str(replacement)
            )
            self.assertEqual(default.read_bytes(), b"keep default file")

    def test_repair_does_not_overwrite_original_if_backup_fails(self):
        with TemporaryDirectory() as directory:
            root = Path(directory)
            workspace = root / "workspace.json"
            original = b'{"script":"Keep this draft","settings":{"speed":null}}'
            workspace.write_bytes(original)
            with patch("phonivra_engine.storage.tempfile.NamedTemporaryFile", side_effect=OSError):
                studio = self.start(root)
            self.assertEqual(studio.script, "Keep this draft")
            self.assertIn("Could not back up workspace.json", studio.snapshot()["status"])
            snapshot = studio.dispatch(TextCommand(type="script.update", text="New draft"))
            self.assertTrue(snapshot["statusIsError"])
            self.assertEqual(workspace.read_bytes(), original)
