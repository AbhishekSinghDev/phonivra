# Phonivra

A desktop text-to-speech studio that runs entirely on your machine.

Write or import a script, pick a voice model, tune how it sounds, and export clean audio. Models are downloaded from Hugging Face and run on your own hardware. There are no accounts, no cloud, and no uploads. Your scripts and voices stay with you.

> The desktop interface is under active development. See the [roadmap](#roadmap) for what's in progress.

## How it works

Phonivra is two pieces that ship together:

- **Desktop app**: an Electron app with a React interface.
- **Local engine**: a Python server that starts on your computer when the app opens, downloads the models you choose, and generates audio using your CPU or GPU. It listens on localhost only and is never deployed anywhere.

```
┌────────────────────┐   localhost    ┌─────────────────────┐
│   Desktop app      │ ─────────────▶ │   Local TTS engine  │
│ Electron + React   │ ◀───────────── │   Python server     │
└────────────────────┘                └──────────┬──────────┘
                                                 │
                                       Hugging Face models
                                       (cached on your disk)
```

## Features

- **Many languages**: multilingual narration, with automatic language detection.
- **Voice cloning**: clone a voice from a short reference recording, and save voices as presets.
- **Fine control**: speed, expressiveness, sampling settings, seeds for repeatable results.
- **Script tools**: import `.txt`, `.md`, `.srt`, and `.vtt` files, clean up text before synthesis, and define your own pronunciation rules.
- **Pauses and reactions**: insert timed pauses and expressive tags in the script.
- **Mastering and export**: silence trimming, fades, loudness normalization, and WAV, MP3, FLAC, OGG, and M4A output.
- **Subtitles and transcripts**: SRT and VTT files generated alongside the audio.
- **Batch and chapters**: turn several scripts, or a script split by headings, into separate audio files.
- **Library and projects**: browse past generations, and save or reopen project files.
- **Local models**: models download automatically on first use and are cached on your disk.

## Development

### Requirements

- Node.js 24 (24.22 or newer, below 25)
- [pnpm](https://pnpm.io) 12

### Run it

```bash
pnpm install
pnpm dev
```

### Scripts

| Command          | What it does                      |
| ---------------- | --------------------------------- |
| `pnpm dev`       | Start the app with hot reload     |
| `pnpm build`     | Type-check, then production build |
| `pnpm typecheck` | Type-check the whole project      |
| `pnpm lint`      | Lint with oxlint                  |
| `pnpm format`    | Format with oxfmt                 |
| `pnpm preview`   | Preview the production build      |

## Tech stack

- [Electron](https://www.electronjs.org) with [electron-vite](https://electron-vite.org)
- React 19 and TypeScript (strict)
- Tailwind CSS v4 and [shadcn/ui](https://ui.shadcn.com), built on Base UI and Radix primitives
- Hugeicons for icons, Sonner for toasts, Motion for animation, cmdk for the command palette
- Zustand for state, React Router for routing
- [oxlint](https://oxc.rs) and oxfmt for linting and formatting
- Fonts bundled locally, no CDN

## Project principles

- **The renderer never touches Node.** All OS access goes through a typed `window.api` exposed by the preload script, with context isolation on, Node integration off, and the sandbox enabled.
- **Actions go through one layer.** The interface talks to the engine through a single typed layer, so the UI doesn't change when the implementation behind it does.
- **Consistent UI.** Only shadcn/ui components and semantic design tokens. Light and dark mode everywhere.

## Roadmap

- [x] App foundation: window, title bar, sidebar, theming, toasts
- [ ] New interface covering every feature above
- [ ] Engine started, monitored, and shut down by the desktop app
- [ ] Packaging, signing, and auto-update

## Contributing

The project is moving quickly and the structure is still settling. If you'd like to help, please open an issue to discuss it before sending a pull request.

## License

To be decided. Note that each model you download has its own license, which may restrict commercial use. Check a model's license before using its output commercially.
