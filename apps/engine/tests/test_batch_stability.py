import unittest
from contextlib import closing
from errno import ENOSPC
from pathlib import Path
from tempfile import TemporaryDirectory
from unittest.mock import patch

from phonivra_engine.jobs import Cancelled
from phonivra_engine.schemas import BatchSource, DesktopOperation, SimpleCommand, TextCommand
from phonivra_engine.studio import Studio


class BatchStabilityTests(unittest.TestCase):
    def prepare_batch(self, studio):
        studio.dispatch(BatchSource(type="batch.source", source="text"))
        studio.dispatch(
            TextCommand(
                type="batch.text",
                text="# First\nFirst script\n\n# Second\nSecond script\n\n# Third\nThird script",
            )
        )
        self.assertEqual(len(studio.dispatch(SimpleCommand(type="batch.prepare"))["units"]), 3)

    def test_failed_multi_file_import_preserves_existing_review(self):
        with TemporaryDirectory() as directory, closing(Studio(Path(directory))) as studio:
            root = Path(directory)
            first, second, invalid = (
                root / f"{name}.txt" for name in ("first", "second", "invalid")
            )
            first.write_text("First script", encoding="utf-8")
            second.write_text("Second script", encoding="utf-8")
            invalid.write_bytes(b"\xff")

            def import_files(*files):
                return studio.desktop(
                    DesktopOperation(operation="batch.import", paths=[str(file) for file in files])
                )

            import_files(first)
            original = studio.dispatch(SimpleCommand(type="batch.prepare"))
            scripts = studio.batch_files.copy()
            unit_texts = studio.unit_texts.copy()
            with self.assertRaisesRegex(ValueError, "invalid.txt is not a UTF-8 script"):
                import_files(second, invalid)

            after_failure = studio.snapshot()
            self.assertEqual(after_failure["revision"], original["revision"])
            self.assertEqual(after_failure["batch"], original["batch"])
            self.assertEqual(after_failure["units"], original["units"])
            self.assertEqual(studio.batch_files, scripts)
            self.assertEqual(studio.unit_texts, unit_texts)

            invalid.write_text("Third script", encoding="utf-8")
            retried = import_files(second, invalid)
            self.assertGreater(retried["revision"], original["revision"])
            self.assertEqual(
                [file["name"] for file in retried["batch"]["files"]],
                ["first.txt", "second.txt", "invalid.txt"],
            )
            self.assertFalse(retried["batch"]["reviewed"])
            self.assertEqual(retried["units"], [])
            self.assertEqual(studio.unit_texts, {})

    def test_disk_full_preserves_completed_output_and_skips_remaining_items(self):
        with TemporaryDirectory() as directory, closing(Studio(Path(directory))) as studio:
            self.prepare_batch(studio)
            output = {
                "id": "first",
                "filename": "first.wav",
                "parts": [],
                "settingsSnapshot": None,
            }
            with (
                patch.object(
                    studio.narrator,
                    "generate",
                    side_effect=[output, OSError(ENOSPC, "No space left on device")],
                ) as generate,
                self.assertLogs("phonivra_engine.jobs", level="ERROR"),
            ):
                studio.dispatch(SimpleCommand(type="batch.start"))
                studio.jobs.future.result(timeout=2)
            snapshot = studio.snapshot()
            complete, failed, skipped = snapshot["units"]
            self.assertEqual(snapshot["job"]["phase"], "error")
            self.assertEqual(complete["status"], "complete")
            self.assertEqual(complete["outputId"], output["id"])
            self.assertEqual(snapshot["outputs"][0]["id"], output["id"])
            self.assertEqual(failed["status"], "error")
            self.assertIn("No space left on device", failed["message"])
            self.assertEqual(skipped["status"], "skipped")
            self.assertEqual(generate.call_count, 2)

    def test_cooperative_cancel_keeps_unfinished_items_pending(self):
        with TemporaryDirectory() as directory, closing(Studio(Path(directory))) as studio:
            self.prepare_batch(studio)
            with patch.object(studio.narrator, "generate", side_effect=Cancelled):
                studio.dispatch(SimpleCommand(type="batch.start"))
                studio.jobs.future.result(timeout=2)
            snapshot = studio.snapshot()
            self.assertEqual(snapshot["job"]["phase"], "stopped")
            self.assertEqual([unit["status"] for unit in snapshot["units"]], ["pending"] * 3)
