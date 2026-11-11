"""Small adapters for the pinned upstream revision; keep quirks out of studio logic."""

import json
from contextlib import contextmanager
from pathlib import Path


def configure_local_cangjie(model, directory: Path) -> None:
    # Upstream's from_local asks the Hub for a nested cache entry and catches its
    # offline failure. Populate the converter from our pinned asset explicitly.
    converter = model.tokenizer.cangjie_converter
    converter.word2cj.clear()
    converter.cj2word.clear()
    for entry in json.loads((directory / "Cangjie5_TC.json").read_text()):
        word, code = entry.split("\t")[:2]
        converter.word2cj[word] = code
        converter.cj2word.setdefault(code, []).append(word)


class PairedTokenizer:
    def __init__(self, tokenizer):
        self.tokenizer = tokenizer

    def text_to_tokens(self, text):
        import torch

        tokens = self.tokenizer.text_to_tokens(text)
        return torch.cat([tokens, tokens], dim=0)


@contextmanager
def original_zero_guidance(model, enabled: bool):
    # Original.generate only duplicates tokens for CFG > 0, but its pinned T3
    # inference path always creates a paired BOS batch. At zero, supply the pair
    # without changing the requested guidance value. The second row has zero weight.
    tokenizer = model.tokenizer
    if enabled:
        model.tokenizer = PairedTokenizer(tokenizer)
    try:
        yield
    finally:
        model.tokenizer = tokenizer
