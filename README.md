# Phonivra

UI-first Electron text-to-speech desktop app. Speech generation is not implemented: `src/main/mock-studio.ts` simulates jobs, voices, models and outputs so the UI can be built before a backend exists. The mock is a replaceable adapter behind the typed contract in `src/shared/`. Playback and generation parameter controls use audiocn components. Waveforms are illustrative; audio and recording behavior remains simulated. Action confirmations and errors appear as temporary notifications, while contextual guidance stays near the relevant controls.

## Setup

Use Node 24 (see `.nvmrc`) and the pinned pnpm release from `packageManager`.

```sh
pnpm install
pnpm dev          # Electron window + dev server
pnpm typecheck    # tsc --noEmit for node + web configs
pnpm lint         # oxlint --deny-warnings
pnpm build        # typecheck + electron-vite build
pnpm format       # oxfmt --write .
```

Oxlint runs all six `@shadcn/lint` rules. The generated UI component directory is exempt
from `no-restyle`, `no-arbitrary-values`, and `require-static-classes`, following the
plugin’s component-directory guidance. Configure the rules in `.oxlintrc.json`.

## Structure

- `src/main`: secure window lifecycle, validated external navigation, theme persistence and native appearance synchronization, plus the mock studio adapter.
- `src/preload`: a sandbox-compatible CommonJS context bridge exposing the typed API from `src/shared/api.ts`.
- `src/renderer/src/features`: Narrate, Voices, Models, Batch, Library and Settings screens, lazy loaded.
- `src/renderer/src/components`: title bar, sidebar, and shared `components/studio/*` composites.
- `src/renderer/src/stores`: Zustand shell and studio state.
- `src/shared`: the typed studio contract (`studio.ts`, `api.ts`, `validation.ts`) and the voice/model catalog and fixtures used by the mock.

The desktop window uses the Phonivra icon as its native icon on Windows and Linux.
New sessions start with empty narration, pronunciation dictionary, and voice preset text fields.

See `AGENTS.md` for rules that apply to future changes.
