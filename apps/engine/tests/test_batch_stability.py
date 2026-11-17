import unittest
from contextlib import closing
from pathlib import Path
from tempfile import TemporaryDirectory

from phonivra_engine.schemas import DesktopOperation, SimpleCommand
from phonivra_engine.studio import Studio


class BatchStabilityTests(unittest.TestCase):
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
