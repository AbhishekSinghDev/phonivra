"""ONNX Runtime acceleration for the pinned Multilingual V3 speech transformer."""

import sys
import tempfile
from functools import lru_cache
from pathlib import Path

PROVIDER = "DmlExecutionProvider"


@lru_cache(maxsize=1)
def available() -> bool:
    if sys.platform != "win32":
        return False
    try:
        import onnxruntime as ort

        ort.disable_telemetry_events()
        return PROVIDER in ort.get_available_providers()
    except (ImportError, OSError):
        return False


class DirectMLError(RuntimeError):
    pass


def export_transformer(t3, path: Path) -> None:
    import torch

    class ExportCache:
        def __init__(self, tensors):
            self.tensors = list(tensors)

        def update(self, key, value, layer):
            index = 2 * layer
            key = torch.cat((self.tensors[index], key), dim=2)
            value = torch.cat((self.tensors[index + 1], value), dim=2)
            self.tensors[index : index + 2] = key, value
            return key, value

    class Transformer(torch.nn.Module):
        def __init__(self):
            super().__init__()
            self.layers = t3.tfmr.layers
            self.rotary = t3.tfmr.rotary_emb
            self.norm = t3.tfmr.norm

        def forward(self, embeddings, positions, mask, *past):
            cache = ExportCache(past)
            rotary = self.rotary(embeddings, positions)
            for layer in self.layers:
                embeddings = layer(
                    embeddings,
                    attention_mask=mask,
                    position_embeddings=rotary,
                    past_key_values=cache,
                )
            return self.norm(embeddings[:, -1:, :]), *cache.tensors

    config = t3.tfmr.config
    previous_attention = config._attn_implementation
    config._attn_implementation = "eager"
    cache_count = 2 * len(t3.tfmr.layers)
    inputs = ["embeddings", "positions", "mask", *(f"past_{i}" for i in range(cache_count))]
    outputs = ["hidden", *(f"present_{i}" for i in range(cache_count))]
    axes = {
        "embeddings": {1: "tokens"},
        "positions": {1: "tokens"},
        "mask": {2: "tokens", 3: "total_tokens"},
        **{name: {2: "past_tokens"} for name in inputs[3:]},
        **{name: {2: "total_tokens"} for name in outputs[1:]},
    }
    try:
        with torch.inference_mode():
            torch.onnx.export(
                Transformer().eval(),
                (
                    torch.zeros(2, 3, config.hidden_size),
                    torch.arange(3).unsqueeze(0),
                    torch.zeros(1, 1, 3, 4),
                    *(
                        torch.zeros(2, config.num_key_value_heads, 1, config.head_dim)
                        for _ in range(cache_count)
                    ),
                ),
                path,
                input_names=inputs,
                output_names=outputs,
                dynamic_axes=axes,
                opset_version=17,
                dynamo=False,
            )
    finally:
        config._attn_implementation = previous_attention


class TransformerSession:
    """Keep the KV cache in the execution provider between autoregressive steps."""

    def __init__(self, path: Path, t3, provider=PROVIDER):
        import onnxruntime as ort

        options = ort.SessionOptions()
        options.execution_mode = ort.ExecutionMode.ORT_SEQUENTIAL
        options.enable_mem_pattern = False
        options.graph_optimization_level = ort.GraphOptimizationLevel.ORT_ENABLE_BASIC
        options.add_session_config_entry("session.record_ep_graph_assignment_info", "1")
        self.session = ort.InferenceSession(
            str(path), options, providers=[provider], enable_fallback=False
        )
        if self.session.get_providers()[0] != provider:
            raise DirectMLError("The requested ONNX execution provider could not be initialized.")
        if not any(
            graph.ep_name == provider for graph in self.session.get_provider_graph_assignment_info()
        ):
            raise DirectMLError(
                "The requested provider could not accelerate the speech transformer."
            )
        self.device = "dml" if provider == PROVIDER else "cpu"
        self.cache_names = [value.name for value in self.session.get_inputs()[3:]]
        self.output_names = [value.name for value in self.session.get_outputs()[1:]]
        config = t3.tfmr.config
        self.initial_shape = (2, config.num_key_value_heads, 1, config.head_dim)

    def __call__(self, *, inputs_embeds, past_key_values=None, **_):
        import numpy as np
        import torch
        from transformers.modeling_outputs import BaseModelOutputWithPast

        try:
            binding = self.session.io_binding()
            tokens = inputs_embeds.shape[1]
            if past_key_values is None:
                # DirectML requires nonempty tensors. Mask the dummy cache entry on every step.
                past_length = 1
                initial = np.zeros(self.initial_shape, dtype=np.float32)
                for name in self.cache_names:
                    binding.bind_cpu_input(name, initial)
            else:
                past_length = past_key_values[0].shape()[2]
                for name, value in zip(self.cache_names, past_key_values, strict=True):
                    binding.bind_ortvalue_input(name, value)

            positions = np.arange(past_length - 1, past_length - 1 + tokens, dtype=np.int64)
            columns = np.arange(past_length + tokens)
            masked = (columns == 0) | (columns > positions[:, None] + 1)
            mask = np.where(masked, np.float32(-10000), np.float32(0))[None, None]
            binding.bind_cpu_input("embeddings", inputs_embeds.detach().numpy())
            binding.bind_cpu_input("positions", positions[None])
            binding.bind_cpu_input("mask", mask)
            binding.bind_output("hidden", "cpu")
            for name in self.output_names:
                binding.bind_output(name, self.device)
            self.session.run_with_iobinding(binding)
            binding.synchronize_outputs()
            hidden, *present = binding.get_outputs()
            values = hidden.numpy()
            if not np.isfinite(values).all():
                raise DirectMLError("DirectML returned invalid speech transformer values.")
            states = torch.from_numpy(values)
            return BaseModelOutputWithPast(
                last_hidden_state=states, hidden_states=(states,), past_key_values=present
            )
        except DirectMLError:
            raise
        except Exception as error:
            raise DirectMLError("DirectML could not run the speech transformer.") from error


def accelerate(t3) -> None:
    try:
        # Export only verified local weights. No third-party graph or custom operators.
        with tempfile.TemporaryDirectory(prefix="phonivra-directml-") as directory:
            path = Path(directory) / "transformer.onnx"
            export_transformer(t3, path)
            t3.tfmr.forward = TransformerSession(path, t3)
    except DirectMLError:
        raise
    except Exception as error:
        raise DirectMLError("DirectML could not prepare the speech transformer.") from error
