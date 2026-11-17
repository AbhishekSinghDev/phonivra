import unittest
from contextlib import closing
from pathlib import Path
from tempfile import TemporaryDirectory

import numpy as np
from phonivra_engine.contract import NATIVE_SAMPLE_RATE
from phonivra_engine.library import Library
from phonivra_engine.schemas import Settings, SimpleCommand
from phonivra_engine.storage import read_json, write_json
from phonivra_engine.studio import Studio
from phonivra_engine.text import Chunk
from pydantic import ValidationError


class SyntheticModel:
    sr = NATIVE_SAMPLE_RATE

    def generate(self, _text, _prompt, _jobs):
        return np.full(self.sr // 4, 0.1, dtype=np.float32)


class OutputPersistenceTests(unittest.TestCase):
    def render(self, studio: Studio, backend: str) -> dict:
        script = "A narration to keep."
        studio.models.active_backend = backend
        return studio.narrator._render(
            SyntheticModel(),
            "indicf5",
            script,
            [Chunk(script, 0.0)],
            Settings(title="Round trip", language="bn", model="indicf5"),
            42,
            "Test voice",
            studio.storage.outputs,
            len(script),
            None,
            duration_limit=1.0,
        )

    def test_generated_output_survives_refresh_and_restart(self):
        with TemporaryDirectory() as directory:
            root = Path(directory)
            with closing(Studio(root)) as studio:
                record = self.render(studio, "cpu")
                self.assertEqual(record["backend"], "cpu")
                studio.accept_output(record)
                refreshed = studio.dispatch(SimpleCommand(type="outputs.refresh"))
                self.assertEqual(refreshed["outputs"], [Library.summarize(record)])
                studio.maintenance.future.result(timeout=2)

            with closing(Studio(root)) as restarted:
                self.assertEqual(restarted.snapshot()["outputs"], [Library.summarize(record)])
                path = restarted.library.media_path(record["id"])
                self.assertEqual(path.name, record["filename"])
                exported = root / "export.wav"
                restarted.library.export(record["id"], "audio", exported)
                self.assertEqual(exported.read_bytes(), path.read_bytes())

    def test_legacy_sidecar_without_backend_loads(self):
        with TemporaryDirectory() as directory, closing(Studio(Path(directory))) as studio:
            record = self.render(studio, "cpu")
            path = (studio.storage.outputs / record["filename"]).with_suffix(".json")
            sidecar = read_json(path)
            del sidecar["output"]["backend"]
            write_json(path, sidecar)

            self.assertEqual(studio.library.refresh(), [Library.summarize(sidecar["output"])])
            self.assertEqual(studio.library.output_path(record["id"]).name, record["filename"])

    def test_library_revision_omits_unchanged_summaries_and_fetches_details_separately(self):
        with TemporaryDirectory() as directory, closing(Studio(Path(directory))) as studio:
            baseline = studio.snapshot()
            record = self.render(studio, "cpu")
            path = studio.storage.outputs / record["filename"]
            record["parts"][0]["text"] = "x" * 100_000
            write_json(path.with_suffix(".json"), {"phonivraVersion": 1, "output": record})
            studio.accept_output(record)

            updated = studio.snapshot(baseline["outputsRevision"])
            (summary,) = updated["outputs"]
            self.assertEqual(summary["partCount"], 1)
            self.assertNotIn("parts", summary)
            self.assertNotIn("settingsSnapshot", summary)
            update = studio.dispatch(
                SimpleCommand(type="status.dismiss"), updated["outputsRevision"]
            )
            self.assertNotIn("outputs", update)
            self.assertEqual(update["outputsRevision"], updated["outputsRevision"])
            self.assertEqual(studio.library.output_details(path, summary)["parts"], record["parts"])
            self.assertEqual(studio.library.records[record["id"]], summary)

    def test_invalid_record_does_not_publish_audio_or_companions(self):
        with TemporaryDirectory() as directory, closing(Studio(Path(directory))) as studio:
            with self.assertRaisesRegex(ValidationError, "backend"):
                self.render(studio, "auto")
            self.assertEqual(list(studio.storage.outputs.iterdir()), [])
