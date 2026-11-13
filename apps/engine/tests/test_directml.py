import tempfile
import unittest
from pathlib import Path
from types import SimpleNamespace
from unittest.mock import Mock, patch

from phonivra_engine.directml import DirectMLError, TransformerSession, export_transformer
from phonivra_engine.inference import Narrator
from phonivra_engine.jobs import Cancelled
from phonivra_engine.models import Models
from phonivra_engine.schemas import Settings


class DirectMLTests(unittest.TestCase):
    def test_export_matches_pytorch_with_growing_cache(self):
        try:
            import onnxruntime  # noqa: F401
        except ImportError:
            self.skipTest("ONNX Runtime is unavailable")
        import torch
        from transformers import LlamaConfig, LlamaModel

        config = LlamaConfig(
            hidden_size=32,
            intermediate_size=64,
            num_attention_heads=4,
            num_key_value_heads=2,
            num_hidden_layers=2,
        )
        model = LlamaModel(config).eval()
        t3 = SimpleNamespace(tfmr=model)
        with tempfile.TemporaryDirectory() as directory, torch.inference_mode():
            path = Path(directory) / "speech.onnx"
            export_transformer(t3, path)
            session = TransformerSession(path, t3, "CPUExecutionProvider")
            expected_cache = exported_cache = None
            for length in (5, 1, 1):
                embeddings = torch.rand(2, length, config.hidden_size)
                expected = model(inputs_embeds=embeddings, past_key_values=expected_cache)
                exported = session(inputs_embeds=embeddings, past_key_values=exported_cache)
                torch.testing.assert_close(
                    exported.last_hidden_state, expected.last_hidden_state[:, -1:]
                )
                expected_cache = expected.past_key_values
                exported_cache = exported.past_key_values

    def test_directml_is_opt_in(self):
        models = Models(Path.cwd(), Mock())
        with (
            patch("phonivra_engine.directml.available", return_value=True),
            patch("torch.cuda.is_available", return_value=False),
            patch("torch.backends.mps.is_available", return_value=False),
        ):
            self.assertEqual(models.backend(), "cpu")
            models.mode = "directml"
            self.assertEqual(models.backend(), "directml")
            self.assertTrue(models.device()["available"])

    def test_directml_retries_on_cpu_with_the_same_seed(self):
        jobs = Mock()
        narrator = Narrator(Mock(), jobs)
        result = {"backend": "cpu"}
        with (
            tempfile.TemporaryDirectory() as directory,
            patch.object(narrator, "_generate", side_effect=[DirectMLError(), result]) as generate,
            self.assertLogs("phonivra_engine.inference"),
        ):
            self.assertEqual(
                narrator.generate(
                    "नमस्ते।", Settings(language="hi"), "", None, "Default", Path(directory)
                ),
                result,
            )
        first, second = generate.call_args_list
        self.assertEqual(first.args, second.args)
        self.assertEqual(second.kwargs, {"force_cpu": True})
        jobs.checkpoint.assert_called_once()

    def test_cancellation_does_not_retry_on_cpu(self):
        narrator = Narrator(Mock(), Mock())
        with (
            patch.object(narrator, "_generate", side_effect=Cancelled) as generate,
            self.assertRaises(Cancelled),
        ):
            narrator.generate("नमस्ते।", Settings(language="hi"), "", None, "Default", Path.cwd())
        generate.assert_called_once()
