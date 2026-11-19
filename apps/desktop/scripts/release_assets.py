"""Prepare one installer per target and verify a complete set before drafting a release."""

import argparse
import hashlib
import json
import os
import re
import shutil
from pathlib import Path

TARGETS = {"win-x64": ".exe", "mac-arm64": ".dmg", "linux-x64": ".deb"}
MAX_RELEASE_ASSET_SIZE = 2 * 1024**3


def validate_version(version: str) -> str:
    if not re.fullmatch(
        r"[0-9]+\.[0-9]+\.[0-9]+(?:-[0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*)?", version
    ):
        raise ValueError(f"Unsupported desktop release version: {version!r}")
    return version


def installer_name(version: str, target: str) -> str:
    return f"Phonivra-{version}-{target}{TARGETS[target]}"


def checksum(path: Path) -> str:
    if not path.is_file() or not 0 < path.stat().st_size < MAX_RELEASE_ASSET_SIZE:
        raise ValueError(f"{path.name} must be a nonempty file smaller than 2 GiB.")
    with path.open("rb") as stream:
        return hashlib.file_digest(stream, "sha256").hexdigest()


def collect(source: Path, output: Path, version: str, target: str) -> None:
    packages = list(source.glob(f"*{TARGETS[target]}"))
    if len(packages) != 1:
        raise ValueError(
            f"Expected exactly one {TARGETS[target]} for {target}, found {len(packages)}."
        )
    package = packages[0]
    digest = checksum(package)
    name = installer_name(version, target)
    mode = os.environ["RELEASE_SIGNING"]
    metadata = {
        "target": target,
        "version": version,
        "commit": os.environ["GITHUB_SHA"],
        "workflowRun": os.environ["GITHUB_RUN_ID"],
        "releaseMode": mode,
        "osSigned": mode == "signed" and target != "linux-x64",
        "mediaTag": os.environ["MEDIA_TAG"] or None,
        "mediaSha256": os.environ["MEDIA_SHA256"],
        "asset": name,
        "sha256": digest,
    }
    output.mkdir(parents=True, exist_ok=False)
    shutil.move(package, output / name)
    (output / f"{target}.json").write_text(
        json.dumps(metadata, indent=2) + "\n", encoding="utf-8"
    )


def assemble(source: Path, output: Path, version: str) -> None:
    checksums = []
    artifacts = []
    media_checksums = json.loads(os.environ["MEDIA_CHECKSUMS"])
    for target in TARGETS:
        directory = source / f"phonivra-{target}"
        name = installer_name(version, target)
        path = directory / name
        metadata = json.loads(
            (directory / f"{target}.json").read_text(encoding="utf-8")
        )
        expected = {
            "target": target,
            "version": version,
            "commit": os.environ["GITHUB_SHA"],
            "workflowRun": os.environ["GITHUB_RUN_ID"],
            "releaseMode": "signed",
            "osSigned": target != "linux-x64",
            "mediaTag": os.environ["MEDIA_TAG"],
            "mediaSha256": media_checksums[target],
            "asset": name,
            "sha256": checksum(path),
        }
        if any(metadata.get(key) != value for key, value in expected.items()):
            raise ValueError(f"{name} does not match the approved signed workflow run.")
        checksums.append(f"{expected['sha256']}  {name}")
        artifacts.append((path, metadata))
    output.mkdir(parents=True, exist_ok=False)
    for path, _ in artifacts:
        shutil.move(path, output / path.name)
    (output / "SHA256SUMS.txt").write_text(
        "\n".join(checksums) + "\n", encoding="utf-8"
    )
    (output / "build-metadata.json").write_text(
        json.dumps([metadata for _, metadata in artifacts], indent=2) + "\n",
        encoding="utf-8",
    )


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("source", type=Path)
    parser.add_argument("output", type=Path)
    parser.add_argument("version", type=validate_version)
    parser.add_argument("--target", choices=TARGETS)
    args = parser.parse_args()
    if args.target:
        collect(args.source, args.output, args.version, args.target)
    else:
        assemble(args.source, args.output, args.version)
