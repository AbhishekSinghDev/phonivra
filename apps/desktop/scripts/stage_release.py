"""Stage a native Electron release with a standalone Python runtime and verified media tools."""

import argparse
import hashlib
import json
import os
import platform
import re
import shutil
import subprocess
import sys
import tempfile
import zipfile
from pathlib import Path

DESKTOP = Path(__file__).resolve().parents[1]
ENGINE = DESKTOP.parent / "engine"
STAGE = DESKTOP / ".release"
PYTHON_VERSION = "3.12.15"
WINDOWS = sys.platform == "win32"
PYTHON_EXECUTABLE = "python.exe" if WINDOWS else "bin/python3"
MEDIA_FILES = tuple(
    f"{name}.exe" if WINDOWS else name for name in ("ffmpeg", "ffprobe")
) + ("THIRD-PARTY-NOTICES.txt",)


def stage_media(archive: Path, expected: str, destination: Path) -> None:
    if not re.fullmatch(r"[a-f0-9]{64}", expected):
        raise SystemExit("Set the SHA-256 for the approved FFmpeg archive.")
    with archive.open("rb") as stream:
        if hashlib.file_digest(stream, "sha256").hexdigest() != expected:
            raise SystemExit("FFmpeg archive checksum does not match.")
        stream.seek(0)
        with zipfile.ZipFile(stream) as bundle:
            if sorted(bundle.namelist()) != sorted(MEDIA_FILES):
                raise SystemExit(
                    f"FFmpeg archive must contain exactly {', '.join(MEDIA_FILES)}."
                )
            destination.mkdir(parents=True)
            for name in MEDIA_FILES:
                if not 0 < bundle.getinfo(name).file_size <= 256 * 1024 * 1024:
                    raise SystemExit(f"Unexpected file size for {name}.")
                target = destination / name
                with bundle.open(name) as source, target.open("xb") as output:
                    shutil.copyfileobj(source, output)
                if name != "THIRD-PARTY-NOTICES.txt":
                    target.chmod(0o755)
                    subprocess.run([str(target), "-version"], check=True, timeout=15)


def stage_python(working: Path, destination: Path) -> None:
    uv = shutil.which("uv")
    if not uv:
        raise SystemExit("Install uv before preparing a release.")
    managed = working / "managed-python"
    install = [
        uv,
        "python",
        "install",
        f"cpython-{PYTHON_VERSION}",
        "--install-dir",
        str(managed),
    ]
    if WINDOWS:
        install.append("--no-registry")
    subprocess.run([*install, "--no-bin"], check=True)
    runtimes = list(managed.glob(f"cpython-{PYTHON_VERSION}-*"))
    if len(runtimes) != 1:
        raise SystemExit("Could not identify the standalone Python runtime.")
    shutil.move(runtimes[0], destination)
    python = destination / PYTHON_EXECUTABLE
    purelib = Path(
        subprocess.check_output(
            [
                python,
                "-I",
                "-c",
                "import sysconfig; print(sysconfig.get_path('purelib'))",
            ],
            text=True,
        ).strip()
    ).resolve()
    if not purelib.is_relative_to(destination.resolve()):
        raise SystemExit(
            "The standalone Python installation resolved outside its bundle."
        )
    requirements = working / "requirements.txt"
    subprocess.run(
        [uv, "export", "--locked", "--no-dev", "--no-emit-project", "-o", requirements],
        cwd=ENGINE,
        check=True,
    )
    subprocess.run(
        [
            uv,
            "pip",
            "sync",
            "--python",
            python,
            "--target",
            purelib,
            "--link-mode",
            "copy",
            requirements,
        ],
        check=True,
    )
    shutil.copytree(
        ENGINE / "src",
        purelib / "phonivra_engine",
        ignore=shutil.ignore_patterns("__pycache__"),
    )


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--media", type=Path, required=True)
    parser.add_argument("--sha256", required=True)
    args = parser.parse_args()
    if sys.platform not in {"linux", "win32", "darwin"}:
        raise SystemExit(f"Unsupported release platform: {sys.platform}")
    desktop = json.loads((DESKTOP / "package.json").read_text(encoding="utf-8"))
    if not (DESKTOP / desktop["main"]).is_file():
        raise SystemExit("Build the desktop application before staging a release.")
    if STAGE.resolve() != STAGE:
        raise SystemExit("Release staging must be inside the desktop workspace.")
    STAGE.mkdir(exist_ok=True)
    for directory in ("app", "engine"):
        path = STAGE / directory
        if path.exists():
            shutil.rmtree(path)
    with tempfile.TemporaryDirectory(dir=STAGE) as temporary:
        working = Path(temporary)
        engine = working / "engine"
        stage_media(args.media, args.sha256, engine / "media")
        stage_python(working, engine / "python")
        shutil.move(engine, STAGE / "engine")
    python = STAGE / "engine" / "python" / PYTHON_EXECUTABLE
    subprocess.run(
        [
            python,
            "-I",
            "-B",
            "-c",
            (
                "import torch; import phonivra_engine.server; "
                "import chatterbox.mtl_tts; import chatterbox.tts_turbo; "
                "from f5_tts.model import CFM, DiT; import vocos; "
                + (
                    "from phonivra_engine.directml import available; "
                    "assert available(), 'The Windows runtime is missing DirectML'; "
                    if WINDOWS
                    else ""
                )
                + "print(torch.__version__)"
            ),
        ],
        check=True,
        timeout=120,
    )
    subprocess.run(
        [python, "-I", "-B", "-m", "unittest", "discover", "-s", ENGINE / "tests"],
        env={**os.environ, "PHONIVRA_MEDIA_DIR": str(STAGE / "engine" / "media")},
        check=True,
        timeout=120,
    )
    app = STAGE / "app"
    shutil.copytree(DESKTOP / "out", app / "out")
    metadata = {
        key: desktop[key] for key in ("name", "version", "description", "main", "type")
    }
    metadata["author"] = "Phonivra contributors"
    metadata["homepage"] = "https://github.com/AbhishekSinghDev/phonivra"
    (app / "package.json").write_text(json.dumps(metadata) + "\n", encoding="utf-8")
    print(f"Staged Phonivra for {sys.platform}/{platform.machine()}.")


if __name__ == "__main__":
    main()
