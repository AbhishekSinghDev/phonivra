"""Offline inference for the pinned AI4Bharat checkpoint."""

from pathlib import Path

from .contract import NATIVE_SAMPLE_RATE


class IndicF5:
    sr = NATIVE_SAMPLE_RATE

    def __init__(self, directory: Path, vocoder: Path, device: str):
        from f5_tts.infer.utils_infer import load_vocoder
        from f5_tts.model import CFM, DiT
        from f5_tts.model.utils import get_tokenizer
        from safetensors.torch import load_file

        vocab, size = get_tokenizer(str(directory / "checkpoints/vocab.txt"), "custom")
        self.model = CFM(
            transformer=DiT(
                dim=1024,
                depth=22,
                heads=16,
                ff_mult=2,
                text_dim=512,
                conv_layers=4,
                text_num_embeds=size,
                mel_dim=100,
            ),
            mel_spec_kwargs={"mel_spec_type": "vocos"},
            odeint_kwargs={"method": "euler"},
            vocab_char_map=vocab,
        )
        prefix = "ema_model._orig_mod."
        weights = load_file(directory / "model.safetensors")
        state = {
            key.removeprefix(prefix): value
            for key, value in weights.items()
            if key.startswith(prefix)
        }
        for key in ("mel_spec.mel_stft.mel_scale.fb", "mel_spec.mel_stft.spectrogram.window"):
            state.pop(key, None)
        self.model.load_state_dict(state)
        self.device = device
        self.model.eval().to(device)
        self.vocoder = load_vocoder(is_local=True, local_path=str(vocoder), device=device)

    def prepare(self, reference: Path, transcript: str):
        import soundfile as sf
        import torch

        audio, rate = sf.read(reference, dtype="float32", always_2d=True)
        seconds = len(audio) / rate
        if not 5 <= seconds <= 12 or not audio.any():
            raise ValueError("Choose a reference with 5 to 12 seconds of audible speech.")
        return (torch.from_numpy(audio.T.copy()), rate), transcript.strip() + " "

    def generate(self, text, reference, jobs):
        from f5_tts.infer.utils_infer import chunk_text, infer_batch_process

        (audio, rate), transcript = reference
        seconds = audio.shape[-1] / rate
        limit = max(32, int(len(transcript.encode()) / seconds * (25 - seconds)))
        chunks = chunk_text(text, max_chars=limit)

        import numpy as np

        with self.model.transformer.register_forward_pre_hook(lambda *_: jobs.checkpoint()):
            try:
                waves = [
                    wave
                    for wave, _ in infer_batch_process(
                        (audio, rate),
                        transcript,
                        chunks,
                        self.model,
                        self.vocoder,
                        device=self.device,
                        progress=None,
                        streaming=True,
                    )
                ]
            finally:
                self.model.transformer.clear_cache()
        if not waves:
            raise ValueError("IndicF5 returned no audio for this passage.")
        return np.concatenate(waves)
