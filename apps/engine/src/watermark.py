"""Check a bounded excerpt with PerTh in a terminable process."""

import math
import subprocess
import sys
import tempfile
import time
from pathlib import Path

from . import audio
from .jobs import Jobs

WINDOW_SECONDS = 10
SAMPLE_RATE = 32_000  # Sample rate of PerTh's bundled implicit model.
DETECTOR_TIMEOUT = 90


def verify(path: Path, temporary: Path, jobs: Jobs) -> float:
    with tempfile.TemporaryDirectory(dir=temporary) as directory:
        excerpt = Path(directory) / "excerpt.wav"
        audio.ffmpeg(
            [
                *audio.input_options(path),
                "-i",
                str(path),
                "-map",
                "0:a:0",
                "-t",
                str(WINDOW_SECONDS),
                "-ac",
                "1",
                "-ar",
                str(SAMPLE_RATE),
                "-c:a",
                "pcm_f32le",
                str(excerpt),
            ],
            jobs,
            timeout=30,
        )
        jobs.progress("preparing", 50, "Checking the opening audio excerpt…")
        result = Path(directory) / "score.txt"
        with subprocess.Popen(
            [sys.executable, "-I", "-m", __name__, str(excerpt), str(result)],
            stdin=subprocess.DEVNULL,
            stdout=subprocess.DEVNULL,
            creationflags=audio.MEDIA_CREATION_FLAGS,
        ) as process:
            deadline = time.monotonic() + DETECTOR_TIMEOUT
            try:
                while process.poll() is None:
                    jobs.checkpoint()
                    if time.monotonic() >= deadline:
                        raise ValueError("The watermark check timed out.")
                    time.sleep(0.1)
            finally:
                if process.poll() is None:
                    process.kill()
            if process.returncode:
                raise ValueError("PerTh could not check the watermark for this audio.")
            score = float(result.read_text(encoding="ascii"))
            if not math.isfinite(score):
                raise ValueError("PerTh could not check the watermark for this audio.")
            return score


def detect(path: Path) -> float:
    import perth
    import soundfile as sf
    import torch

    torch.set_num_threads(2)
    samples, rate = sf.read(path, frames=WINDOW_SECONDS * SAMPLE_RATE, dtype="float32")
    with torch.inference_mode():
        detector = perth.PerthImplicitWatermarker()
        return float(detector.get_watermark(samples, sample_rate=rate))


if __name__ == "__main__":
    Path(sys.argv[2]).write_text(str(detect(Path(sys.argv[1]))), encoding="ascii")
