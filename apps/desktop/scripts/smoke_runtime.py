"""Exercise the staged or packaged runtime without downloading a speech model."""

import argparse
import http.client
import json
import os
import secrets
import subprocess
import sys
import tempfile
import wave
from pathlib import Path
from queue import Empty, Queue
from threading import Thread

CONTRACT = Path(__file__).resolve().parents[2] / "engine" / "src" / "contract.json"
WINDOWS = sys.platform == "win32"
PYTHON_EXECUTABLE = "python.exe" if WINDOWS else "bin/python3"
RECORDING_DEVICE = {"linux": "pulse", "darwin": "avfoundation", "win32": "dshow"}


def media_binary(runtime: Path, name: str) -> Path:
    return runtime / "media" / (f"{name}.exe" if WINDOWS else name)


def runtime_environment(runtime: Path, scratch: Path) -> dict[str, str]:
    media = str(runtime / "media")
    inherited_path = os.environ.get("PATH")
    return {
        **os.environ,
        "PATH": f"{media}{os.pathsep}{inherited_path}" if inherited_path else media,
        "PHONIVRA_MEDIA_DIR": media,
        "HF_HUB_OFFLINE": "1",
        "TRANSFORMERS_OFFLINE": "1",
        "MPLCONFIGDIR": str(scratch / "matplotlib"),
    }


def smoke_media(runtime: Path, scratch: Path) -> None:
    ffmpeg = media_binary(runtime, "ffmpeg")
    ffprobe = media_binary(runtime, "ffprobe")
    driver = RECORDING_DEVICE[sys.platform]
    devices = subprocess.check_output(
        [ffmpeg, "-hide_banner", "-devices"], text=True, timeout=15
    )
    if not any(
        parts and "D" in parts[0] and parts[1:2] == [driver]
        for parts in (line.split() for line in devices.splitlines())
    ):
        raise RuntimeError(
            f"The bundled FFmpeg does not include the {driver} recording driver."
        )
    source = scratch / "input.wav"
    with wave.open(str(source), "wb") as fixture:
        fixture.setparams((1, 2, 24000, 0, "NONE", "not compressed"))
        fixture.writeframes(bytes(4800))
    for extension, encoder, codec in (
        ("wav", "pcm_s16le", "pcm_s16le"),
        ("mp3", "libmp3lame", "mp3"),
        ("flac", "flac", "flac"),
        ("ogg", "libvorbis", "vorbis"),
        ("m4a", "aac", "aac"),
    ):
        output = scratch / f"output.{extension}"
        subprocess.run(
            [ffmpeg, "-nostdin", "-v", "error", "-i", source, "-c:a", encoder, output],
            check=True,
            timeout=15,
        )
        actual = subprocess.check_output(
            [
                ffprobe,
                "-v",
                "error",
                "-select_streams",
                "a:0",
                "-show_entries",
                "stream=codec_name",
                "-of",
                "csv=p=0",
                output,
            ],
            text=True,
            timeout=15,
        ).strip()
        if actual != codec:
            raise RuntimeError(
                f"Expected {codec} audio in {output.name}, got {actual!r}."
            )


def smoke_engine(runtime: Path, scratch: Path) -> None:
    contract = json.loads(CONTRACT.read_text(encoding="utf-8"))
    secret = secrets.token_hex(32)
    python = runtime / "python" / PYTHON_EXECUTABLE
    with (
        tempfile.TemporaryFile(mode="w+", encoding="utf-8", errors="replace") as errors,
        subprocess.Popen(
            [python, "-I", "-B", "-u", "-m", "phonivra_engine"],
            cwd=runtime,
            env=runtime_environment(runtime, scratch),
            stdin=subprocess.PIPE,
            stdout=subprocess.PIPE,
            stderr=errors,
            encoding="utf-8",
            errors="replace",
        ) as engine,
    ):
        ready: Queue[dict | None] = Queue(maxsize=1)

        def wait_for_handshake() -> None:
            reported = False
            for line in engine.stdout:
                if reported:
                    continue
                try:
                    message = json.loads(line)
                except ValueError:
                    continue
                if isinstance(message, dict) and "phonivraEngine" in message:
                    ready.put(message)
                    reported = True
            if not reported:
                ready.put(None)

        reader = Thread(target=wait_for_handshake, daemon=True)
        reader.start()
        try:
            engine.stdin.write(
                json.dumps({"root": str(scratch / "workspace"), "secret": secret})
            )
            engine.stdin.write("\n")
            engine.stdin.flush()
            try:
                handshake = ready.get(timeout=90)
            except Empty:
                raise RuntimeError(
                    "The bundled engine did not report ready within 90 seconds."
                ) from None
            if (
                handshake is None
                or handshake.get("phonivraEngine") != contract["protocolVersion"]
            ):
                raise RuntimeError(
                    "The bundled engine did not report the expected protocol version."
                )
            port = handshake.get("port")
            if type(port) is not int or not 0 < port < 65536:
                raise RuntimeError(
                    "The bundled engine did not report a valid loopback port."
                )
            connection = http.client.HTTPConnection(
                contract["loopbackHost"], port, timeout=10
            )
            try:
                connection.request(
                    "GET", "/snapshot", headers={"Authorization": f"Bearer {secret}"}
                )
                response = connection.getresponse()
                if response.status != 200 or not isinstance(
                    json.load(response).get("revision"), int
                ):
                    raise RuntimeError(
                        f"The bundled engine failed its first snapshot ({response.status})."
                    )
            finally:
                connection.close()
            engine.stdin.close()
            if engine.wait(timeout=15):
                raise RuntimeError(
                    "The bundled engine failed to exit cleanly after stdin closed."
                )
        except Exception:
            if engine.poll() is None:
                engine.kill()
                engine.wait()
            errors.seek(0)
            print(errors.read(16_384), file=sys.stderr)
            raise
        finally:
            reader.join(timeout=5)


def smoke_inference_dependencies(runtime: Path, scratch: Path) -> None:
    code = """
import platform
import sys
import torch
import chatterbox.mtl_tts
import chatterbox.tts_turbo
import vocos
from f5_tts.infer.utils_infer import infer_batch_process
from pydub import AudioSegment
from torchaudio.transforms import MelSpectrogram

if sys.platform == "linux" and platform.machine() == "x86_64":
    assert torch.version.cuda is None, "The Linux installer must bundle CPU-only PyTorch"
if sys.platform == "win32":
    from phonivra_engine.directml import available
    assert available(), "The Windows runtime is missing DirectML"

features = MelSpectrogram(n_mels=16)(torch.zeros(2400))
assert features.shape[0] == 16 and torch.isfinite(features).all()
assert len(AudioSegment.from_file(sys.argv[1], format="mp3")) > 0
print(f"Verified inference dependencies with PyTorch {torch.__version__}.")
"""
    subprocess.run(
        [
            runtime / "python" / PYTHON_EXECUTABLE,
            "-I",
            "-B",
            "-c",
            code,
            scratch / "output.mp3",
        ],
        check=True,
        timeout=120,
        env=runtime_environment(runtime, scratch),
    )


def verify_runtime(runtime: Path) -> None:
    runtime = runtime.resolve(strict=True)
    with tempfile.TemporaryDirectory(prefix="phonivra-smoke-") as directory:
        scratch = Path(directory)
        smoke_media(runtime, scratch)
        smoke_engine(runtime, scratch)
        smoke_inference_dependencies(runtime, scratch)
    print(f"Verified the engine handshake and audio codecs in {runtime}.")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "runtime", type=Path, help="Path to the engine resources directory"
    )
    verify_runtime(parser.parse_args().runtime)
