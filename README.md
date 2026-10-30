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

## Workspace behavior

The current desktop app uses an in-memory studio adapter. Speech, file operations and playback
are simulated; a running local speech engine is not implemented yet.

- In the script editor, Ctrl+S (⌘+S on macOS) saves a project and Ctrl+O (⌘+O) opens one.
  Ctrl+Enter (⌘+Enter) generates narration.
- Importing over existing script text, opening a project, and restoring factory defaults ask for
  confirmation before replacing work.
- The sidebar job status opens the workspace handling the job. Narration controls wait while a
  batch or standalone model download runs.
- Library search keeps the detail pane within the matching results. Clear search restores the list.
- Model storage links open Settings directly to Storage and downloads.
- If the studio cannot connect, the loading screen offers Retry connection.
- Voice previews share the voice, model and language settings used by Narrate and Batch.

## Development

### Requirements

- Node.js 24 (24.22 or newer, below 25)
- [pnpm](https://pnpm.io) 12

### Workspace layout

```text
apps/
  desktop/       Electron + React application (package: phonivra)
  website/       Next.js App Router marketing site (package: @phonivra/website)
packages/
  ui/            Shared shadcn components, styles and support code (@phonivra/ui)
```

The repository root owns pnpm, Turborepo, oxlint and oxfmt. All workspaces extend the
root lint baseline and reference the same formatter configuration. Application dependencies
and TypeScript configurations stay with each app. The shared UI package owns its component
dependencies, fonts and styles; React and React DOM are peers supplied by each app.
The desktop's `src/shared/` IPC contract remains private to the desktop app.

### Run it

Use Node.js 24.22.0 or newer (below 25) and the pinned pnpm 12.15.0. From the repository root:

```bash
pnpm install
pnpm dev
```

This starts the desktop and website together. The desktop renderer uses
`http://127.0.0.1:5173`; the website uses `http://127.0.0.1:3000`.
Use `pnpm dev:desktop` or `pnpm dev:website` to start one app.

### Scripts

| Command             | What it does                                              |
| ------------------- | --------------------------------------------------------- |
| `pnpm dev`          | Start both apps with hot reload                           |
| `pnpm build`        | Build both apps (desktop also type-checks before build)   |
| `pnpm typecheck`    | Type-check all workspaces, generating Next.js types first |
| `pnpm lint`         | Lint all workspaces with oxlint; warnings fail            |
| `pnpm format`       | Format the whole repository with oxfmt                    |
| `pnpm format:check` | Check formatting without writing                          |
| `pnpm preview`      | Preview the desktop production build                      |

The same `dev`, `build`, `typecheck`, `lint`, `format`, and `format:check` commands work
inside either app directory. From `apps/website`, `pnpm start` serves the production build.
From the root, `pnpm --filter phonivra <command>` and
`pnpm --filter @phonivra/website <command>` target a single app.
Install dependencies once at the root and commit the single generated `pnpm-lock.yaml`.
For CI, use `pnpm install --frozen-lockfile`, then `pnpm typecheck`, `pnpm lint`,
`pnpm format:check`, and `pnpm build`. There is no existing CI workflow in this repository.

### Task caching and configuration

`turbo.json` orders build and check tasks after the corresponding tasks of workspace
dependencies. App builds also depend on their workspace dependencies' type checks.
Builds cache desktop `out/` and website `.next/` output, excluding Next.js
cache and dev output. Type checks cache generated Next.js declarations and TypeScript
incremental metadata. Lint caches successful checks. Development and formatting writes
are never cached. Root formatting includes workspace configuration and documentation too.

Each app's tracked files and local `.env*` files are build/type-check inputs. Changes to
root lint/format configuration or `.nvmrc` invalidate task caches; Turbo also accounts for
workspace manifests and the lockfile. Next.js public environment variables are inferred
by Turbo. Declare additional build-time variables in the task's `env` list when introducing
them. Keep environment files inside the app that consumes them.

### Shared UI and adding components

`packages/ui` is the single source for shadcn and audiocn components, the `cn` utility,
their browser-only support hooks/audio helpers, locally bundled fonts, and all theme tokens,
base styles and component styling. It exports TypeScript source directly; Vite and Next.js
compile it with the app, so no separate UI build or watch process is needed. Next.js lists
`@phonivra/ui` in `transpilePackages`. Use imports such as:

```tsx
import { Button } from '@phonivra/ui/components/button'
import { cn } from '@phonivra/ui/lib/utils'
```

Both app CSS entry points import `@phonivra/ui/globals.css`. Tailwind v4 scanning is explicit:
the shared stylesheet scans `packages/ui/src`, and each app entry scans its own source tree.
Keep appearance changes in `packages/ui/src/styles/globals.css`; the desktop entry adds only
its document scrolling/selection constraints. Desktop theme persistence stays in Electron;
the website uses an app-owned `next-themes` adapter, defaults to dark, and applies the
shared `.dark` class before hydration. Its theme toggle supports light and dark. The website
preloads the existing shared Manrope font with `next/font/local`; all fonts remain locally bundled.
Shared components receive theme values through props rather than importing desktop APIs.
All components are client boundaries so Next.js server pages can import them safely.

All three `components.json` files use the same style, Hugeicons and neutral base color.
They route UI, utility and hook files to `@phonivra/ui`, and point CSS changes to the shared
stylesheet. Add components from the repository root:

```bash
pnpm ui:add @shadcn/aspect-ratio --dry-run
pnpm ui:add @shadcn/aspect-ratio
```

Replace `aspect-ratio` with the component you need. The installed CLI version is owned by the
UI package; to use the latest official CLI explicitly, run
`pnpm dlx shadcn@latest add @shadcn/aspect-ratio` from `packages/ui`.
The existing `@audiocn` registry is configured there too. Before updating an existing
component, inspect `pnpm ui:add @shadcn/accordion --diff` and merge carefully to
preserve local styling. Do not overwrite existing components without reviewing changes.
The wildcard package exports make new component files available to both apps immediately;
new `.tsx` hooks need a matching export, like the existing audio-provider hooks.
Then run `pnpm install`, `pnpm typecheck`, `pnpm lint`, `pnpm format:check`, and `pnpm build`
from the repository root. Turbo tracks UI source changes through dependency tasks, so app
builds and checks cannot reuse stale cache entries after a UI change.

The website is a single marketing page with a tabbed feature showcase, planned model and
language coverage, release availability, and an FAQ. The feature showcase uses shared Radix
Tabs to explore Narration, Voices, Batch, Library and Models. Narration and Voices frame
details from the owner-supplied screenshots using CSS; the other panels use workflow
illustrations. Feature copy identifies simulated and planned behavior. All product claims come from `docs/FEATURES.md`.
The route composes section components inside `SiteShell`; it contains no inline section markup.
`HeroSection`, the desktop menu/window/Dock, individual feature visuals and the bento cards
have focused components. `SiteLogo` shares header/footer branding, and `site-links.ts` owns
the repository and author URLs. Navigation uses Next.js `Link`, including page anchors.
GitHub and author links open a new tab with `noopener noreferrer`.
The bento section highlights planned pronunciation preparation, on-device processing,
chapter review and audio companion files. It uses the shared Card components, with
informational diagrams rather than interactive app controls.
The following three-step workflow section uses an editorial split layout inspired by
Cofounder's how-it-works reference on Vibrant. Script, settings and export examples stay
visible without additional interactions, and the copy identifies engine-dependent steps
as planned.
The technology foundation section adapts Mobbin's central integration composition from
Vibrant into a static diagram of Chatterbox, Hugging Face and FFmpeg. These are planned
engine dependencies, not third-party app connectors or partnership claims.
The download area uses Tella's centered CTA composition from Vibrant, adapted to the shared
Phonivra artwork and neutral theme. It directs visitors to the release FAQ and lists installer
unavailability for each platform without inventing download links or dates.
The FAQ adapts Foglamp's minimal split composition from Vibrant with the shared accordion.
The release-status answer is open initially; the original factual answers remain intact.
The footer follows Foglamp's quiet multi-column reference on Vibrant, with the existing
Phonivra logo, page anchors and development status. It includes no assumed legal, social
or contact links. The owner-provided GitHub repository and personal website are linked in
the footer, with a "Built with love by Abhishek" credit. The registry block was inspected but not applied because its bundled
theme would replace shared styles.
Page order is hero, how it works, workspace features, feature details, technology foundations,
models and languages, FAQ, availability, then footer. This introduces the workflow before
its details and answers release questions before the closing availability section.
The separate local-studio text strip has been removed to avoid repeating the newer sections.
The model catalog retains all four model comparisons and 23 languages, with a compact
comparison beside the language index on desktop, and a stacked layout on smaller screens.
The page explicitly identifies the simulated engine and file flows; there are no download
links until installers exist. Shared components and tokens come from `@phonivra/ui`. Product
screenshots in `apps/website/public/images` are owner-supplied 1920×1080 captures in both
themes. They are served as lossless PNGs inside a decorative macOS-style desktop scene,
with an original generated wallpaper, menu bar, floating app window and Dock. The window
visually clips the original 48px title bar without modifying the supplied image files.
The surrounding OS controls and Dock are illustrative and non-interactive. Refresh
both captures when the desktop interface changes. The background and
favicon are copies of existing desktop artwork.

Before release, replace the marked availability placeholders with verified installer links,
distribution formats, architectures and minimum hardware requirements. Add release timing,
app/model license details and a production canonical URL only when confirmed. Do not turn
planned workflows into present-tense claims until the implementation is verified against
`docs/FEATURES.md`. No production domain is assumed in the current metadata.
<details>
<summary>Desktop mockup wallpaper provenance</summary>

Asset: `apps/website/public/images/desktop-wallpaper.png`. Generated with the built-in
image generation tool. The app screenshots are supplied by the owner and remain unchanged.
The Dock icons are local vector artwork.

Generation prompt:

> Use case: illustration-story. Asset type: original wallpaper for a macOS-inspired desktop
> product mockup on a marketing website. Create only the wallpaper, absolutely no UI, no text,
> no logos, no windows, no device, no dock, no icons. Wide landscape 16:10 composition, high
> resolution. A premium abstract desktop wallpaper inspired by flowing silk and smooth folded
> translucent glass: deep midnight navy and muted ocean blue across the left and top, luminous
> ice blue arcs through the center, a restrained warm peach and pale sand sweep toward the
> lower right. Elegant large sculptural curves, softly lit, flawless smooth gradients, subtle
> depth, clean photorealistic rendered material. An open quiet central region will sit behind
> a large app window, with the most beautiful flowing detail visible around the outer edges.
> Calm refined Apple-like art direction, polished and understated. Full bleed edge to edge.
> No grain, no noise, no grids, no hexagons, no fake Apple branding.

</details>

Electron preload, IPC contracts, and persisted app identity remain in `apps/desktop`.
Next.js automatic agent-rule generation is disabled so development keeps the root `AGENTS.md`
as the single source of project instructions.

Configuration follows the official [Turborepo task guidance](https://turborepo.dev/docs/crafting-your-repository/configuring-tasks),
[Next.js installation guidance](https://nextjs.org/docs/app/getting-started/installation),
[shadcn monorepo guidance](https://ui.shadcn.com/docs/monorepo),
and [Oxlint shared configuration guidance](https://oxc.rs/docs/guide/usage/linter/config.html).

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
