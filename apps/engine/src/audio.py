"""Audio conversion and mastering. FFmpeg subprocesses are cancellable and bounded."""

import math
import os
import shutil
import subprocess
import sys
import time
from pathlib import Path

import numpy as np
import soundfile as sf

from .contract import MAX_RECORDING_SECONDS, NATIVE_SAMPLE_RATE
from .jobs import Jobs
from .schemas import Settings

MEDIA_CREATION_FLAGS = getattr(subprocess, "CREATE_NO_WINDOW", 0)

# Demuxers for supported audio containers only. Playlists and concat are excluded.
DEMUXERS = {
    ".wav": "wav",
    ".mp3": "mp3",
    ".flac": "flac",
    ".ogg": "ogg",
    ".m4a": "mov",
    ".opus": "ogg",
    ".aiff": "aiff",
    ".aif": "aiff",
}


def media_binary(name: str) -> str | None:
    bundled = os.environ.get("PHONIVRA_MEDIA_DIR")
    if not bundled:
        return shutil.which(name)
    path = Path(bundled) / (f"{name}.exe" if sys.platform == "win32" else name)
    return str(path) if path.is_file() else None


BLOCK_FRAMES = 65_536
MAX_WAVEFORM_SECONDS = 4 * 60 * 60


def input_options(path: Path) -> list[str]:
    demuxer = DEMUXERS.get(path.suffix.lower())
    if demuxer is None:
        raise ValueError("Choose a supported audio file.")
    options = ["-protocol_whitelist", "file", "-f", demuxer]
    if demuxer == "mov":
        options.extend(["-enable_drefs", "0"])
    return options


def ffmpeg(arguments: list[str], jobs: Jobs | None = None, timeout: int = 1800) -> None:
    binary = media_binary("ffmpeg")
    if not binary:
        raise ValueError("FFmpeg is required. Install it and restart Phonivra.")
    # A temporary stderr file avoids pipe deadlocks on long encodes.
    import tempfile

    with tempfile.TemporaryFile() as errors:
        process = subprocess.Popen(
            [
                binary,
                "-nostdin",
                "-y",
                "-hide_banner",
                "-loglevel",
                "error",
                "-max_alloc",
                "67108864",
                *arguments,
            ],
            stdin=subprocess.DEVNULL,
            stdout=subprocess.DEVNULL,
            stderr=errors,
            creationflags=MEDIA_CREATION_FLAGS,
        )
        started = time.monotonic()
        try:
            while process.poll() is None:
                if jobs:
                    jobs.checkpoint()
                if time.monotonic() - started > timeout:
                    raise ValueError("Audio processing timed out.")
                time.sleep(0.1)
            if process.returncode:
                errors.seek(0)
                raise ValueError(
                    errors.read(4000).decode(errors="replace").strip()
                    or "FFmpeg could not process this audio."
                )
        finally:
            if process.poll() is None:
                process.terminate()
                try:
                    process.wait(timeout=3)
                except subprocess.TimeoutExpired:
                    process.kill()
                    process.wait()


def reference_audio(source: Path, destination: Path) -> float:
    ffmpeg(
        [
            *input_options(source),
            "-i",
            str(source),
            "-vn",
            "-t",
            str(MAX_RECORDING_SECONDS),
            "-ac",
            "1",
            "-ar",
            str(NATIVE_SAMPLE_RATE),
            "-c:a",
            "pcm_s16le",
            str(destination),
        ],
        timeout=60,
    )
    duration = sf.info(destination).duration
    if duration < 5:
        destination.unlink(missing_ok=True)
        raise ValueError(
            "Use a clean reference recording of at least 5 seconds; 6+ is recommended."
        )
    return duration


def audible_range(file: sf.SoundFile, jobs: Jobs) -> tuple[int, int]:
    first, last, offset = None, 0, 0
    for block in file.blocks(blocksize=BLOCK_FRAMES, dtype="float32"):
        jobs.checkpoint()
        audible = np.flatnonzero(np.abs(block) > 10 ** (-50 / 20))
        if audible.size:
            if first is None:
                first = offset + int(audible[0])
            last = offset + int(audible[-1]) + 1
        offset += len(block)
    if first is None:
        return 0, file.frames
    padding = int(file.samplerate * 0.02)
    return max(0, first - padding), min(file.frames, last + padding)


def loudness_gain(file: sf.SoundFile, start: int, frames: int, target: float, jobs: Jobs) -> float:
    from pyloudnorm.iirfilter import IIRfilter
    from scipy.signal import lfilter

    rate = file.samplerate
    filters = (
        IIRfilter(4.0, 1 / math.sqrt(2), 1500.0, rate, "high_shelf"),
        IIRfilter(0.0, 0.5, 38.0, rate, "high_pass"),
    )
    coefficients = [(stage.b, stage.a) for stage in filters]
    states = [np.zeros(2) for _ in filters]
    # BS.1770 uses overlapping 400 ms gates at 100 ms intervals.
    step = rate // 10
    energies = []
    peak = 0.0
    file.seek(start)
    for block in file.blocks(frames=frames, blocksize=step * 32, dtype="float32"):
        jobs.checkpoint()
        peak = max(peak, float(np.max(np.abs(block))))
        for index, (b, a) in enumerate(coefficients):
            block, states[index] = lfilter(b, a, block, zi=states[index])
        squared = np.square(block)
        energies.extend(np.add.reduceat(squared, np.arange(0, len(block), step)))
    gated = np.convolve(energies, np.ones(4), mode="valid") / (step * 4)
    gated = gated[: round((frames - step * 4) / step) + 1]
    absolute_threshold = 10 ** ((-70 + 0.691) / 10)
    audible = gated[gated >= absolute_threshold]
    if not audible.size:
        return 0.0
    accepted = gated[gated > max(absolute_threshold, float(audible.mean()) / 10)]
    if not accepted.size:
        return 0.0
    measured = -0.691 + 10 * math.log10(float(accepted.mean()))
    return min(target - measured, 20 * math.log10(0.99 / peak)) if peak else 0.0


def master(
    source: Path, destination: Path, settings: Settings, jobs: Jobs
) -> tuple[int, int, float, float]:
    with sf.SoundFile(source) as file:
        rate = file.samplerate
        start, end = audible_range(file, jobs) if settings.trim_silence else (0, file.frames)
        frames = end - start
        gain = (
            loudness_gain(file, start, frames, settings.loudness_target, jobs)
            if settings.loudness and frames > rate * 0.4
            else 0.0
        )
        fade_frames = min(int(rate * settings.fade_ms / 1000), frames)
        fade = np.linspace(0, 1, fade_frames) if frames >= fade_frames * 2 else np.array([])
        fade_frames = len(fade)
        multiplier = 10 ** (gain / 20)
        offset = 0
        file.seek(start)
        with sf.SoundFile(destination, "w", rate, 1, subtype="PCM_16") as output:
            for block in file.blocks(frames=frames, blocksize=BLOCK_FRAMES, dtype="float32"):
                jobs.checkpoint()
                block *= multiplier
                head = max(0, min(len(block), fade_frames - offset))
                if head:
                    block[:head] *= fade[offset : offset + head]
                tail_start = max(0, frames - fade_frames - offset)
                if tail_start < len(block):
                    tail_offset = offset + tail_start - (frames - fade_frames)
                    block[tail_start:] *= fade[::-1][
                        tail_offset : tail_offset + len(block) - tail_start
                    ]
                output.write(np.clip(block, -0.99, 0.99))
                offset += len(block)
    return frames, rate, gain, start / rate


def encode(source: Path, destination: Path, settings: Settings, jobs: Jobs) -> None:
    codecs = {
        "wav": ["-c:a", "pcm_s16le"],
        "mp3": ["-c:a", "libmp3lame", "-b:a", "192k"],
        "flac": ["-c:a", "flac"],
        "ogg": ["-c:a", "libvorbis", "-q:a", "6"],
        "m4a": ["-c:a", "aac", "-b:a", "192k"],
    }
    if (
        settings.format == "wav"
        and settings.speed == 1
        and sf.info(source).samplerate == settings.sample_rate
    ):
        shutil.copyfile(source, destination)
        return
    ffmpeg(
        [
            *input_options(source),
            "-i",
            str(source),
            "-vn",
            "-af",
            f"atempo={settings.speed}",
            "-ar",
            str(settings.sample_rate),
            *codecs[settings.format],
            str(destination),
        ],
        jobs,
    )


def duration(path: Path) -> tuple[float, int]:
    if not path.is_file() or path.is_symlink():
        raise ValueError("Choose a regular audio file.")
    try:
        info = sf.info(path)
        return info.duration, info.samplerate
    except (RuntimeError, sf.LibsndfileError):
        probe = media_binary("ffprobe")
        if not probe:
            raise ValueError("FFprobe is required to inspect this audio format.") from None
        import json

        try:
            result = subprocess.run(
                [
                    probe,
                    "-v",
                    "error",
                    "-select_streams",
                    "a:0",
                    "-show_entries",
                    "stream=sample_rate:format=duration",
                    "-of",
                    "json",
                    "-max_alloc",
                    "67108864",
                    *input_options(path),
                    str(path),
                ],
                capture_output=True,
                text=True,
                timeout=30,
                creationflags=MEDIA_CREATION_FLAGS,
                check=True,
            )
            info = json.loads(result.stdout)
            return float(info["format"]["duration"]), int(info["streams"][0]["sample_rate"])
        except (subprocess.SubprocessError, KeyError, IndexError, TypeError, ValueError):
            raise ValueError("Could not read this audio file.") from None


def waveform(path: Path, temporary: Path) -> list[float]:
    """Bound peak extraction memory even for long narrations."""
    import tempfile

    def peaks(source: Path) -> list[float]:
        with sf.SoundFile(source) as file:
            if file.channels > 32:
                raise ValueError("This audio file has too many channels.")
            read_frames = BLOCK_FRAMES // file.channels
            frames = min(file.frames, MAX_WAVEFORM_SECONDS * file.samplerate)
            bin_frames = max(1, math.ceil(frames / 160))
            values = []
            for remaining in range(frames, 0, -bin_frames):
                frames_in_bin = min(remaining, bin_frames)
                peak = 0.0
                for offset in range(0, frames_in_bin, read_frames):
                    block = file.read(min(read_frames, frames_in_bin - offset), dtype="float32")
                    if block.size:
                        peak = max(peak, float(np.max(np.abs(block))))
                values.append(min(1.0, peak))
            return values or [0.0]

    try:
        return peaks(path)
    except sf.LibsndfileError:
        with tempfile.TemporaryDirectory(dir=temporary) as directory:
            decoded = Path(directory) / "waveform.wav"
            ffmpeg(
                [
                    *input_options(path),
                    "-i",
                    str(path),
                    "-vn",
                    "-ac",
                    "1",
                    "-ar",
                    "8000",
                    "-t",
                    str(MAX_WAVEFORM_SECONDS),
                    str(decoded),
                ],
                timeout=120,
            )
            return peaks(decoded)
