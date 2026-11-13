# Desktop releases

Build on the target operating system and architecture. The installer workflow builds Windows
x64 (NSIS), Linux x64 (Debian package), and macOS arm64 (DMG). The installers include Python,
its locked dependencies, FFmpeg and FFprobe. Speech models download separately after installation.
The current Linux runtime includes the locked CUDA dependencies, which increases installer size.

## Prepare the media binaries

Prepare a self-contained FFmpeg build for each target. Use binaries with the platform input
driver (DirectShow, PulseAudio or AVFoundation), the supported audio formats, and the encoders
used for export. Include the applicable notices and make corresponding source available according
to the distribution terms of your FFmpeg build and its libraries.

Place the two binaries at the root of a ZIP archive with `THIRD-PARTY-NOTICES.txt`. Use
`ffmpeg.exe` and `ffprobe.exe` on Windows and `ffmpeg` and `ffprobe` elsewhere. Name the
archives `ffmpeg-win-x64.zip`, `ffmpeg-linux-x64.zip`, and `ffmpeg-mac-arm64.zip`. Put the
reviewed archives on a GitHub Release and record their SHA-256 digests independently in the
repository variable `PHONIVRA_MEDIA_SHA256` as a JSON map keyed by the target names above.

## Review distribution notices

- Verify that each installer includes the Phonivra license and credits, runtime license files, and notices for the exact third-party versions shipped. Use the [third-party credits](../../THIRD_PARTY_NOTICES.md) as a starting point and review the staged Electron, Python, and media contents for each target.
- Record the FFmpeg and FFprobe versions, build configuration, and external libraries for each archive. Preserve the applicable notices and provide corresponding source for the exact distributed build as required, including relevant patches and build instructions. Link to that source from the release or download page. See [FFmpeg's licensing guidance](https://ffmpeg.org/legal.html).
- Model weights are downloaded separately. If a release starts bundling model files, verify the terms at the exact revision and include the applicable upstream notices with those files.

## Build and verify

Run the **Desktop installers** workflow with the media release tag. It uploads installer
artifacts to the workflow run. For local packaging, install the pinned workspace dependencies,
Python 3.12, Git and uv 0.13.5, then run these commands on the target system.

```sh
pnpm --filter phonivra build
python apps/desktop/scripts/stage_release.py --media <archive.zip> --sha256 <reviewed-sha256>
pnpm --filter phonivra package
```

Run the installed application on a clean machine. Check first launch, light and dark themes,
model download and verification, generation on CPU, available GPU modes, importing and recording
a voice reference, playback and seeking, project save/open, export, and quit during an active job.

On Windows, qualify the DirectML preview with the installed app on an RX 470, a newer discrete
Radeon, and a Radeon integrated GPU. Generate short and long Hindi narration with Multilingual V3
using both the default voice and a reference voice. Confirm that the output metadata reports
`directml`, compare audio and total generation time with CPU, and record the GPU and driver.
Test CPU fallback before enabling DirectML in Auto or listing a card as supported.

Signed workflow runs use the `desktop-signing` environment from `master`. Configure a protected
environment and the following signing credentials before running a signed build.

- Windows uses `WINDOWS_CSC_LINK` and `WINDOWS_CSC_KEY_PASSWORD`.
- macOS uses `MAC_CSC_LINK`, `MAC_CSC_KEY_PASSWORD`, `APPLE_ID`,
  `APPLE_APP_SPECIFIC_PASSWORD`, and `APPLE_TEAM_ID`.

Signed builds verify the Windows installer signature and the macOS app signature and
notarization ticket. Publish reviewed installers only after the clean-machine checks and the distribution notice review. The app currently uses manual updates.
