import unittest
from contextlib import closing
from pathlib import Path
from tempfile import TemporaryDirectory
from unittest.mock import patch

from phonivra_engine.schemas import ModelCommand
from phonivra_engine.studio import Studio


class ModelConnectivityTests(unittest.TestCase):
    def test_explicit_download_can_start_without_diagnostics_and_report_retry(self):
        with TemporaryDirectory() as directory, closing(Studio(Path(directory))) as studio:
            initial = studio.snapshot()
            self.assertIsNone(initial["dependencies"]["online"])
            command = ModelCommand(type="model.download", id="multilingual")
            with (
                patch.object(
                    studio.models,
                    "download",
                    side_effect=[ConnectionError("Model host unreachable"), Path(directory)],
                ) as download,
                self.assertLogs("phonivra_engine.jobs", level="ERROR"),
            ):
                studio.dispatch(command)
                studio.jobs.future.result(timeout=2)
                state = studio.snapshot()
                model = next(model for model in state["models"] if model["id"] == command.id)
                self.assertEqual(model["status"], "error")
                self.assertEqual(model["message"], "Model host unreachable")
                self.assertEqual(state["job"]["phase"], "error")

                studio.dispatch(command)
                studio.jobs.future.result(timeout=2)
                state = studio.snapshot()
                model = next(model for model in state["models"] if model["id"] == command.id)
                self.assertNotIn("message", model)
                self.assertEqual(state["job"]["phase"], "complete")
                self.assertEqual(download.call_count, 2)
