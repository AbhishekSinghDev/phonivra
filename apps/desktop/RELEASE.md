# Desktop releases

The desktop version comes from [package.json](package.json). A release tag has
the form `v0.1.0` or `v0.1.0-rc.1` and points to the reviewed commit on
`master` with the matching desktop version. Use a fresh version for every
published build. GitHub Release notes serve as the changelog.

| Target                  | Installer   | Runtime                                    |
| ----------------------- | ----------- | ------------------------------------------ |
| Windows x64             | NSIS `.exe` | CPU, with DirectML preview where qualified |
| macOS Apple silicon     | `.dmg`      | CPU and Apple Metal                        |
| Debian-family Linux x64 | `.deb`      | CPU                                        |

Each installer includes standalone Python, its locked dependencies, FFmpeg, and
FFprobe. Users download models during first-run setup. Verify each installer is
under 2 GiB and record the actual download and disk sizes.

The first public release targets Debian-family Linux x64. Both workflows build
only Linux by default. The manual `all_platforms` option enables Windows and macOS.

## Prepare the media binaries

Run **Desktop media tools** on a reviewed commit to build the Linux archive
from checksum-pinned upstream sources. Each Actions artifact includes the
binary ZIP, its SHA-256, and a corresponding-source archive containing the
inputs, build script, and FFmpeg configuration. You can also run
`bash apps/desktop/scripts/build_media.sh <target> media-assets` on a native
host with the toolchain listed in the workflow. Build the Linux media archive
on Ubuntu 22.04 to match the oldest Ubuntu image checked by packaging CI.

Prepare one FFmpeg build per target with its audio input driver (DirectShow,
PulseAudio or AVFoundation) and the encoders used by the app. The release
workflow verifies WAV, MP3, FLAC, Ogg Vorbis, and M4A encoding and probing. Verify
recording separately with an actual microphone. Check native library dependencies
on a supported clean system.

Put FFmpeg, FFprobe, and `THIRD-PARTY-NOTICES.txt` at the root of each ZIP. On
Windows use `ffmpeg.exe` and `ffprobe.exe`; elsewhere use `ffmpeg` and `ffprobe`.
Name the archives `ffmpeg-win-x64.zip`, `ffmpeg-linux-x64.zip`, and
`ffmpeg-mac-arm64.zip`.

Record the upstream source revision, build flags, external libraries, patches,
and exact license terms. Retain the notices and make corresponding source for
the distributed build available as required. Link that source from the media
release and the desktop release. See the [FFmpeg licensing guide](https://ffmpeg.org/legal.html).

Upload the reviewed binary ZIPs, checksums, and corresponding-source archives
to a release tagged `media-*`. Mark these as
pre-releases so they stay out of the main download path. Store the independently
verified SHA-256 values in the repository variable `PHONIVRA_MEDIA_SHA256` as a
JSON object keyed by media release tag. For Linux use
`{"media-9.0.2.1":{"linux-x64":"<verified SHA-256>"}}` with the actual tag and
digest. An all-platform release also needs `win-x64` and `mac-arm64` digests.
Keep old entries and assets available, and use a new media tag when any binary
changes.

## Set up release permissions

- Protect `master` and require the `workspace` and `advisories` checks. Restrict
  creation, updates, and deletion of desktop `v*` tags to release maintainers
  through a tag ruleset.
- Restrict `desktop-release` to desktop version tags and configure a reviewer
  where available. Its job can create a draft after the checks and the Linux
  build succeed. Publish the draft in GitHub after the clean-machine checks.
- Enable private vulnerability reporting for the repository and check the link
  in the [security policy](../../SECURITY.md).

## Build and verify

1. Run **Desktop installers** with an empty `media_tag` and signing disabled
   for an initial rehearsal. That run builds FFmpeg from pinned sources and
   uses the resulting workflow artifacts. Pull requests from branches in
   this repository that change packaging also build unsigned previews.
   For a release candidate, dispatch on the matching protected desktop tag
   with an approved `media_tag`. Leave **all_platforms** and **signed** off.
   Turn on **prepare_draft** to verify and upload the `.deb` to a draft.
2. Download the artifacts from the successful run. Review the checksums,
   build commit, and media inputs. Keep a record of the run and the test
   results in the draft or a release tracking issue.
   The Linux job installs the `.deb` in clean Ubuntu 22.04, Ubuntu 24.04,
   and Debian 12 containers. It runs the bundled engine as an ordinary user
   and checks that uninstall preserves the user's workspace.
3. On a clean Linux machine, install as an ordinary user with no
   developer toolchain. Check first launch, app version, model download and
   verification, CPU generation, offline generation after restart, voice
   import and recording, playback, export, project save and open, and quit
   during an active job. Test in-place upgrades and uninstall without losing
   user projects. Record the minimum OS and distro versions that pass.
4. Inspect the installer for bundle-specific license
   texts and credits, including Electron, Python, PyTorch, native wheels,
   and FFmpeg. The renderer build lists its bundled JavaScript dependencies
   in `THIRD_PARTY_JAVASCRIPT_LICENSES.md` inside the app archive.
   Use the [third-party notices](../../THIRD_PARTY_NOTICES.md)
   as a starting point.
5. Include the Linux installer, `SHA256SUMS.txt`, and build metadata in the
   draft. Add release notes with installation and manual upgrade steps,
   platform requirements, sizes, first-run model downloads, known issues, and
   FFmpeg source links. Verify the assets and publish. For a shipping defect,
   mark the affected release and publish a new patch version with the fix.
   The app uses manual updates.

To select a desktop tag explicitly with the GitHub CLI:

```sh
gh workflow run desktop-installers.yml --ref v0.1.0 \
  -f media_tag=media-9.0.2.1 -f prepare_draft=true
```

## Re-enable Windows and macOS releases

- Restrict the `desktop-signing` environment to reviewed `master` and desktop
  version tags. Configure reviewers where available. Scope Windows secrets
  `WINDOWS_CSC_LINK` and `WINDOWS_CSC_KEY_PASSWORD` to this environment. For
  macOS, set `MAC_CSC_LINK`, `MAC_CSC_KEY_PASSWORD`, `APPLE_ID`,
  `APPLE_APP_SPECIFIC_PASSWORD`, and `APPLE_TEAM_ID` there. Verify the Windows
  provider supports the certificate import configured in the workflow.
- Build and approve the media archives with **all_platforms** enabled. Dispatch
  **Desktop installers** with **all_platforms**, **signed**, and the approved
  media tag. A draft then requires all three installers.
- Run the clean-machine checks on each target. Check Authenticode and the
  timestamp on Windows. Open the macOS DMG, install the app, and verify
  Gatekeeper and microphone access.
- On Windows, qualify the DirectML preview on an RX 470, a newer discrete
  Radeon, and a Radeon integrated GPU before listing a card as supported.
  Use short and long Hindi narration with a default and a reference voice.
  Confirm the backend in output metadata, record the GPU and driver, and
  test CPU fallback.

## Build locally

For local packaging, install the pinned workspace dependencies, Python 3.12,
Git, and uv 0.13.5. Run on the target OS and architecture:

```sh
pnpm --filter phonivra build
python3 apps/desktop/scripts/stage_release.py --media path/to/archive.zip --sha256 reviewed-sha256
pnpm --filter phonivra package
```

The staging and package checks use a temporary workspace and a short synthetic
audio file. They verify engine startup, an authenticated snapshot, clean
shutdown, and bundled audio encoding. Models and a live microphone are
exercised during the clean-machine checks.
