import unittest
from contextlib import closing
from pathlib import Path
from tempfile import TemporaryDirectory

import numpy as np
from phonivra_engine.contract import NATIVE_SAMPLE_RATE
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
                self.assertEqual(refreshed["outputs"], [record])

            with closing(Studio(root)) as restarted:
                self.assertEqual(restarted.snapshot()["outputs"], [record])
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

            self.assertEqual(studio.library.refresh(), [sidecar["output"]])
            self.assertEqual(studio.library.output_path(record["id"]).name, record["filename"])

    def test_invalid_record_does_not_publish_audio_or_companions(self):
        with TemporaryDirectory() as directory, closing(Studio(Path(directory))) as studio:
            with self.assertRaisesRegex(ValidationError, "backend"):
                self.render(studio, "auto")
            self.assertEqual(list(studio.storage.outputs.iterdir()), [])
