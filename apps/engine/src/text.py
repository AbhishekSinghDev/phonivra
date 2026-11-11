"""Deterministic script preparation, sentence chunks, and subtitle input parsing."""

import re
import unicodedata
from dataclasses import dataclass
from pathlib import Path

from .contract import MAX_TEXT_LENGTH
from .schemas import Language, Settings

LANGUAGES = [
    "ar",
    "da",
    "de",
    "el",
    "en",
    "es",
    "fi",
    "fr",
    "he",
    "hi",
    "it",
    "ja",
    "ko",
    "ms",
    "nl",
    "no",
    "pl",
    "pt",
    "ru",
    "sv",
    "sw",
    "tr",
    "zh",
]
PAUSE = re.compile(r"\[pause(?:=(\d+(?:\.\d+)?))?\]", re.IGNORECASE)


@dataclass(frozen=True)
class Chunk:
    text: str
    pause: float


def read_script(path: Path) -> str:
    text = path.read_text(encoding="utf-8-sig")
    if len(text) > MAX_TEXT_LENGTH:
        raise ValueError(f"Scripts cannot exceed {MAX_TEXT_LENGTH:,} characters.")
    if path.suffix.lower() not in {".srt", ".vtt"}:
        return text
    blocks = re.split(r"\n\s*\n", text.replace("\r\n", "\n"))
    lines = []
    for block in blocks:
        if "-->" not in block:
            continue
        body = block.split("-->", 1)[1].split("\n", 1)
        if len(body) == 2:
            lines.append(re.sub(r"<[^>]*>", "", body[1]).strip())
    return "\n\n".join(lines)


def detect_language(text: str, fallback: Language) -> Language:
    if len(text.strip()) < 20:
        return fallback
    import langid

    language, _score = langid.classify(text[:10000])
    return language if language in LANGUAGES else fallback


def dictionary_rules(text: str) -> list[tuple[str, str]]:
    rules = []
    for number, line in enumerate(text.splitlines(), 1):
        if not line.strip() or line.lstrip().startswith("#"):
            continue
        pair = re.split(r"\s*(?:=>|=)\s*", line, maxsplit=1)
        if len(pair) != 2 or not all(part.strip() for part in pair):
            raise ValueError(f"Dictionary line {number}: use word = pronunciation.")
        rules.append((pair[0].strip(), pair[1].strip()))
    return sorted(rules, key=lambda rule: len(rule[0]), reverse=True)


def prepare(text: str, settings: Settings, dictionary: str) -> str:
    if settings.strip_markdown:
        text = re.sub(r"```[^\n]*\n?|```", "", text)
        text = re.sub(r"!?\[([^\]]+)\]\([^)]*\)", r"\1", text)
        text = re.sub(r"(?m)^\s{0,3}(?:#{1,6}\s+|>\s*|[-*+]\s+)", "", text)
        text = re.sub(r"(?<!\w)[*_`~]+|[*_`~]+(?!\w)", "", text)
    if settings.remove_emoji:
        text = "".join(
            c
            for c in text
            if not (
                0x1F000 <= ord(c) <= 0x1FAFF or 0x2600 <= ord(c) <= 0x27BF or c in "\u200d\ufe0f"
            )
        )
    if settings.normalize_punct:
        text = unicodedata.normalize("NFKC", text).translate(
            str.maketrans(
                {
                    "“": '"',
                    "”": '"',
                    "‘": "'",
                    "’": "'",
                    "—": ", ",
                    "…": "...",
                }
            )
        )
        text = re.sub(r"([!?])\1+", r"\1", text)
    if settings.expand_abbrevs and settings.language == "en":
        for source, target in {
            "Dr.": "Doctor",
            "Mr.": "Mister",
            "Mrs.": "Missus",
            "e.g.": "for example",
            "i.e.": "that is",
            "etc.": "etcetera",
        }.items():
            text = re.sub(r"(?<!\w)" + re.escape(source), target, text, flags=re.IGNORECASE)
    if settings.pronounce:
        rules = dictionary_rules(dictionary)
        if rules:
            lookup = {source.casefold(): target for source, target in rules}
            pattern = r"(?<!\w)(?:" + "|".join(re.escape(s) for s, _ in rules) + r")(?!\w)"
            text = re.sub(
                pattern, lambda match: lookup[match[0].casefold()], text, flags=re.IGNORECASE
            )
    if settings.convert_numbers and settings.language in {"en", "hi"}:
        from num2words import num2words

        # Pause durations are control syntax, never spoken-number input.
        pieces = re.split(r"(\[pause(?:=\d+(?:\.\d+)?)?\])", text, flags=re.IGNORECASE)
        for index in range(0, len(pieces), 2):
            pieces[index] = re.sub(
                r"(?<![\w.])-?\d+(?:\.\d+)?(?!\w)",
                lambda match: num2words(match[0], lang=settings.language),
                pieces[index],
            )
        text = "".join(pieces)
    return re.sub(r"[ \t]+", " ", text).strip()


def split_chunks(text: str, limit: int, gap: float) -> list[Chunk]:
    chunks: list[Chunk] = []
    cursor = 0
    for pause in [*PAUSE.finditer(text), None]:
        section = text[cursor : pause.start() if pause else len(text)]
        sentences = re.split(r"(?<=[.!?।॥。！？])\s*|\n+", section)
        current = ""
        for sentence in sentences:
            sentence = sentence.strip()
            while sentence:
                room = limit - len(current) - bool(current)
                if len(sentence) <= room:
                    current = f"{current} {sentence}".strip()
                    break
                if current:
                    chunks.append(Chunk(current, gap))
                    current = ""
                    continue
                cut = sentence.rfind(" ", 0, limit + 1)
                if cut < limit // 2:
                    cut = limit
                chunks.append(Chunk(sentence[:cut].strip(), gap))
                sentence = sentence[cut:].strip()
        if current:
            chunks.append(Chunk(current, gap))
        if pause:
            seconds = float(pause[1]) if pause[1] else gap
            if seconds > 60:
                raise ValueError("An explicit pause cannot exceed 60 seconds.")
            if chunks:
                chunks[-1] = Chunk(
                    chunks[-1].text, chunks[-1].pause + seconds if not section.strip() else seconds
                )
            else:
                chunks.append(Chunk("", seconds))
            cursor = pause.end()
    # Preserve explicit trailing pauses; suppress the final automatic gap.
    if chunks and text[cursor:].strip():
        chunks[-1] = Chunk(chunks[-1].text, 0)
    if not any(chunk.text for chunk in chunks):
        raise ValueError("The script has no spoken text after preparation.")
    return chunks


def chapters(text: str, title: str, split: bool) -> list[tuple[str, str]]:
    if not split:
        return [(title, text)] if text.strip() else []
    result = []
    content: list[str] = []
    for line in text.splitlines():
        heading = re.match(r"^#{1,6}\s+(.+)", line)
        if heading:
            if "\n".join(content).strip():
                result.append((title, "\n".join(content).strip()))
            title, content = heading[1].strip(), []
        else:
            content.append(line)
    if "\n".join(content).strip():
        result.append((title, "\n".join(content).strip()))
    return result
