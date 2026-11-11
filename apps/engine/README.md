# Phonivra local engine

This workspace contains the Python backend for the existing desktop studio. The sibling Chatterbox Narrator
project was a behavior reference; its Gradio application and helpers are not imported or
copied into this engine. Speech synthesis uses the pinned [Chatterbox library by Resemble AI](https://github.com/resemble-ai/chatterbox).
See the [third-party notices](../../THIRD_PARTY_NOTICES.md) for checkpoint sources, licenses, and the upstream citation.

## Development setup

Use Python 3.11–3.13, [uv](https://docs.astral.sh/uv/getting-started/installation/), Git,
and FFmpeg (including FFprobe). Python 3.12 is recommended.
From the repository root:

```sh
pnpm engine:setup
pnpm dev:desktop
```

Setup creates `apps/engine/.venv`; it does not install into system Python.
The root command explicitly runs the engine's `setup` script with `pnpm run`, avoiding
confusion with pnpm's own setup command. Setup pins uv's environment location to this
directory and checks that its Python runtime exists before printing `Engine installed`.
If setup exits with an error, resolve that error before opening the desktop app.
Setup uses `uv sync --locked` with the committed `uv.lock`. This downloads Python
dependencies, including PyTorch. Model downloads happen separately
inside the app. CPU-only development setup is available with `pnpm engine:setup --cpu`.
On Linux, the CPU option replaces the locked PyTorch wheel with its matching CPU build after sync.
The standard Linux PyTorch distribution includes NVIDIA runtime dependencies; a compatible
host driver is still required. Auto prefers CUDA or Apple Metal (MPS) when available and otherwise uses CPU.

`PHONIVRA_PYTHON=/absolute/path/to/python pnpm dev:desktop` selects another prepared
environment. That environment must contain this engine's dependencies. The launcher sets
the engine directory as its working directory, so importing a sibling narrator is unnecessary.

Source files live directly in `apps/engine/src`. Setuptools explicitly maps `src` to
the installed Python package `phonivra_engine`, preserving the desktop's module launch
command. Run `pnpm engine:setup` after changing the layout to refresh the editable
installation. An alternate `PHONIVRA_PYTHON` environment must also have this project
installed, not just its dependencies.

```text
apps/engine/
  src/             Python source modules
  scripts/setup.py Development environment setup
  package.json     pnpm/Turborepo commands
  pyproject.toml   Python package and dependency configuration
  uv.lock          Locked Python dependencies
```

The setup helper lives in `scripts/` so setuptools does not mistake it for a root
package build script.

Electron starts and stops the engine. Do not run a separate Uvicorn server. There is no
fixed port, browser interface, or externally exposed API. The launch handshake uses stdin
and stdout; EOF on stdin also stops an orphaned engine.

The production resource lookup reserves `resources/engine` for the packaged engine.
The [desktop release workflow](../desktop/RELEASE.md) stages a standalone Python runtime and
verified media binaries for each native installer. The development virtual environment stays in the checkout.

The private `@phonivra/engine` workspace exposes `setup`, `check` and `lint` scripts
to pnpm/Turborepo. It has no separate `dev` task: Electron remains the only engine
launcher. The desktop build and typecheck tasks explicitly depend on this workspace’s
syntax check, so backend changes invalidate their caches. Python dependencies remain in `pyproject.toml`
and `uv.lock`; the workspace manifest introduces no JavaScript runtime dependencies.

## Responsibilities

| Module (under `src/`)  | Responsibility                                                                       |
| ---------------------- | ------------------------------------------------------------------------------------ |
| `schemas.py`           | Validated command, settings, desktop-operation and output contracts                  |
| `server.py`            | Authenticated loopback HTTP, media streaming and waveform data                       |
| `studio.py`            | Studio commands and workspace orchestration                                          |
| `jobs.py`              | One compute worker, cancellation, download pause and job state                       |
| `models.py`            | Pinned model manifests, downloads, device selection and model residency              |
| `chatterbox_compat.py` | Local Cangjie assets and Original's zero-guidance batch compatibility                |
| `inference.py`         | Reference conditioning, chunk generation and committing complete outputs             |
| `text.py`              | Subtitle imports, cleanup, dictionary, language detection and chapter/part splitting |
| `audio.py`             | Reference conversion, mastering and cancellable encoding                             |
| `library.py`           | Output sidecars, exports, discovered recordings and voice presets                    |
| `recording.py`         | Native microphone recording using FFmpeg                                             |
| `storage.py`           | App-owned paths and atomic JSON persistence                                          |

Electron owns native file dialogs, opening folders, clipboard access, encrypted download
credentials, and the engine process. The renderer only uses the typed preload bridge.
Actual playback uses one renderer audio session and the restricted `phonivra://media` origin;
the HTTP port and session secret never enter the renderer. Ordinary browser permissions
remain denied. Voice recording uses PulseAudio-compatible input on Linux, AVFoundation on macOS, and
DirectShow on Windows. The Record button requires an FFmpeg build with the platform capture
driver. Recordings stop at 40 seconds. When no microphone is available, upload a recording.

## Data and offline behavior

Workspace settings, drafts, dictionary, saved voices, outputs, previews and rotating logs
live under Electron's `userData` directory. Model assets default to its `models` directory.
Changing the model directory switches caches; it does not migrate or delete the old cache.
Saved projects include text, settings, dictionary and the selected voice ID, but do not
embed reference audio. Moving a project to another machine requires adding its custom voice.

Downloads use Hugging Face's resumable cache and explicit model commit revisions.
Number conversion also pins an upstream source commit: the published `num2words` 0.5.14
release does not include Hindi, while the selected source revision does.
Each model uses an app-owned cache inside the selected folder. Assets must match the pinned
checksums in `src/model-assets.json` before loading. Existing caches from earlier development
builds are preserved. Download the model again to create a verified cache. The multilingual adapter supplies the local Cangjie mapping explicitly,
working around the pinned upstream loader's nested-cache lookup.

Inference loads local checkpoints. Scripts and reference recordings are never sent to a
remote inference service. Downloads and the explicitly requested diagnostics connectivity
check use the network. Credentials are encrypted by Electron, kept out of workspace/project
files and metadata, and only supplied in memory to the downloader. Public downloads can
be used without a token. A usable OS keyring is required to save a token.

Generation snapshots its settings, script, voice reference and dictionary at job start.
Changing editor settings during a job affects the next job. Batch preparation splits headings
before cleanup, and records per-item failures while preserving completed items. The completed
batch ZIP includes each finished audio file and its available companions.

Cancellation checks speech-transformer steps, chunk boundaries, downloads and FFmpeg encoding.
An in-flight model load or decoder operation may finish before cancellation is observed.
Unfinished narration is discarded; completed batch items remain. Jobs are not resumed after
application shutdown. Only one model is resident at a time. Multilingual/Original use half
precision for the text transformer on CUDA; CPU and Turbo/Nano use default precision.

Library refresh also discovers audio placed directly in the output folder. Files without
Phonivra sidecars remain playable/exportable with unavailable metadata marked explicitly.
The voice list starts with the model's default voice and recordings actually present in the
voice folder. No demo voice recordings are bundled. Upload or record references to add voices.

Subtitles use generated chunk timings adjusted for trim and tempo. They are approximate,
not word alignment. Audio is available after a complete generation, not as a live stream.
The selected model's native reaction support and reference requirements still apply.

The transport version, file extensions, sample rates and input limits shared with Electron live in
`src/contract.json`. Chatterbox's unused Gradio dependency is excluded by the engine's uv
configuration. The same configuration selects newer inference dependencies to address advisories.

## Static checks

```sh
pnpm engine:check
pnpm engine:lint
pnpm --filter phonivra typecheck
pnpm --filter phonivra lint
pnpm --filter phonivra build
pnpm format:check
```

`engine:check` compiles Python syntax without importing the engine, loading models, launching
the application, or running inference. Runtime and manual verification are intentionally left
to the developer for this integration.

## Upstream documentation

- [Chatterbox APIs and model examples](https://github.com/resemble-ai/chatterbox)
- [FastAPI response types](https://fastapi.tiangolo.com/advanced/custom-response/)
- [Hugging Face downloads](https://huggingface.co/docs/huggingface_hub/package_reference/file_download)
- [Electron protocols](https://www.electronjs.org/docs/latest/api/protocol)
- [Electron secure credential storage](https://www.electronjs.org/docs/latest/api/safe-storage)
- [FFmpeg microphone devices](https://ffmpeg.org/ffmpeg-devices.html)
- [PyTorch version-specific installation](https://pytorch.org/get-started/previous-versions/)
- [SoundFile](https://python-soundfile.readthedocs.io/)
- [Loudness measurement](https://github.com/csteinmetz1/pyloudnorm)
- [Offline language identification](https://github.com/saffsd/langid.py)
- [Number conversion](https://github.com/savoirfairelinux/num2words)
