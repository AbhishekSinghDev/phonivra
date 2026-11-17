import unittest
from contextlib import closing
from pathlib import Path
from tempfile import TemporaryDirectory
from unittest.mock import patch

from phonivra_engine.schemas import BatchSource, SimpleCommand, TextCommand
from phonivra_engine.studio import Studio


class DraftPersistenceTests(unittest.TestCase):
    def test_failed_save_does_not_replace_committed_text_or_invalidate_review(self):
        with TemporaryDirectory() as directory, closing(Studio(Path(directory))) as studio:
            studio.dispatch(TextCommand(type="script.update", text="Saved narration"))
            studio.dispatch(BatchSource(type="batch.source", source="text"))
            studio.dispatch(TextCommand(type="batch.text", text="Saved batch"))
            original = studio.dispatch(SimpleCommand(type="batch.prepare"))

            script = TextCommand(type="script.update", text="Latest narration")
            batch = TextCommand(type="batch.text", text="Latest batch")
            with patch.object(studio.storage, "save", side_effect=OSError("Disk full")):
                for draft in (script, batch):
                    failed = studio.dispatch(draft)
                    self.assertTrue(failed["statusIsError"])
                    self.assertEqual(failed["status"], "Disk full")
                    self.assertEqual(failed["script"], original["script"])
                    self.assertEqual(failed["batch"], original["batch"])
                    self.assertEqual(failed["units"], original["units"])

            for draft in (script, batch):
                self.assertFalse(studio.dispatch(draft)["statusIsError"])
            with closing(Studio(Path(directory))) as reopened:
                self.assertEqual(reopened.script, script.text)
                self.assertEqual(reopened.batch["text"], batch.text)
