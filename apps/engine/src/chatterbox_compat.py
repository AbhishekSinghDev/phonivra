"""Small adapters for the pinned upstream revision; keep quirks out of studio logic."""

import copy
import json
from pathlib import Path


def clone_conditionals(conditionals):
    if conditionals is None:
        return None

    import torch

    # Device and dtype conversions can leave these tensors attached to autograd.
    # Give deepcopy independent tensor copies while it copies the containers.
    memo = {}
    for values in (vars(conditionals.t3), conditionals.gen):
        for value in values.values():
            if torch.is_tensor(value) and id(value) not in memo:
                memo[id(value)] = value.detach().clone()
    return copy.deepcopy(conditionals, memo)


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
