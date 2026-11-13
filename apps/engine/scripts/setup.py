"""Create the development runtime. Never touches the user's global Python installation."""

import argparse
import os
import shutil
import subprocess
import sys
import tomllib
from pathlib import Path


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    runtime = parser.add_mutually_exclusive_group()
    runtime.add_argument("--cpu", action="store_true", help="Install CPU-only PyTorch wheels")
    runtime.add_argument("--rocm", action="store_true", help="Prepare a Linux AMD ROCm runtime")
    arguments = parser.parse_args()
    if not (3, 11) <= sys.version_info[:2] < (3, 14):
        raise SystemExit("Use Python 3.11, 3.12, or 3.13 to set up the engine.")
    if arguments.rocm and (sys.platform != "linux" or os.uname().machine != "x86_64"):
        raise SystemExit("ROCm development setup requires Linux x86-64.")
    root = Path(__file__).resolve().parents[1]
    environment = root / (".venv-rocm" if arguments.rocm else ".venv")
    uv = shutil.which("uv")
    if not uv:
        raise SystemExit(
            "Install uv first: https://docs.astral.sh/uv/getting-started/installation/"
        )
    environment_variables = {**os.environ, "UV_PROJECT_ENVIRONMENT": str(environment)}
    subprocess.run(
        [uv, "sync", "--locked", "--project", str(root), "--python", sys.executable],
        check=True,
        env=environment_variables,
    )
    python = environment / ("Scripts/python.exe" if sys.platform == "win32" else "bin/python")
    if not python.is_file():
        raise SystemExit(f"Engine setup did not create the Python runtime at {python}.")
    if arguments.rocm:
        subprocess.run(
            [
                uv,
                "pip",
                "install",
                "--python",
                str(python),
                "--index",
                "https://stable.repo.amd.com/rocm/whl-next/",
                "torch[device-all]==2.13.0+rocm10.1.0",
                "torchaudio==2.11.0.2+rocm10.1.0",
            ],
            check=True,
        )
        subprocess.run(
            [
                python,
                "-c",
                (
                    "import torch; import torchaudio; "
                    "assert torch.version.hip, 'Expected ROCm PyTorch'; "
                    "print(f'ROCm {torch.version.hip}: ' + "
                    "(torch.cuda.get_device_name(0) if torch.cuda.is_available() "
                    "else 'no compatible GPU detected'))"
                ),
            ],
            check=True,
        )
        print(f"Launch with PHONIVRA_PYTHON={str(python)!r} pnpm dev:desktop")
    elif arguments.cpu and sys.platform == "linux":
        lock = tomllib.loads((root / "uv.lock").read_text(encoding="utf-8"))
        version = next(
            package["version"] for package in lock["package"] if package["name"] == "torch"
        )
        subprocess.run(
            [
                uv,
                "pip",
                "install",
                "--python",
                str(python),
                "--reinstall-package",
                "torch",
                "--no-deps",
                "--index",
                "https://download.pytorch.org/whl/cpu",
                f"torch=={version}+cpu",
            ],
            check=True,
            env=environment_variables,
        )
    print(f"Engine installed at {environment}. Start Phonivra with pnpm dev:desktop.")


if __name__ == "__main__":
    main()
