# Phonivra

- Stack: Electron + electron-vite, React 19, strict TypeScript, Tailwind CSS v4 with the Vite plugin, shadcn/ui, lucide-react, Sonner, Zustand, HashRouter, pnpm, and locally bundled Inter. Use Node's latest LTS release; see `.nvmrc` and `engines`.
- Use pnpm exclusively. Do not add dependencies without asking. Dependencies required by explicitly requested shadcn components are part of that component installation.
- Use ONLY shadcn/ui components from `src/renderer/src/components/ui`. If one is missing, add it with the official shadcn CLI; never hand-roll a lookalike. Shared app components belong in `components/`; screens and their parts in `features/<name>/`; utilities, state, and hooks in `lib/`, `stores/`, and `hooks/`.
- Use ONLY semantic design tokens (`bg-background`, `text-muted-foreground`, `border-border`, etc.). No hardcoded hex colors. Avoid arbitrary Tailwind values unless unavoidable. Use spacing on the 4px scale, radius from `--radius` only, and one font: Inter. Electron native window colors must match the neutral semantic palette.
- Every screen must work in light and dark modes. Every interactive element needs hover, focus-visible, and disabled states.
- All feature actions are stubs for now: call `notify("<Action> clicked")` from `lib/notify.ts`. Shell navigation, sidebar collapse, and theme selection work and also call notify. Real feature logic goes through typed `window.api` later, so the UI never changes when wiring real behavior.
- The renderer never imports Node or Electron modules. All OS access goes through preload's typed `window.api` and validated IPC. Do not expose raw IPC events or arbitrary channels.
- Never loosen security: `contextIsolation: true`, `nodeIntegration: false`, `sandbox: true`, `webSecurity: true`; strict CSP; block renderer navigation, redirects, webviews, and new windows; validate web URLs before `shell.openExternal`. Deny permissions by default. Disable pinch zoom and file-drop navigation.
- Preserve `show: false` followed by `ready-to-show`, theme-matched window background, the minimum 960x640 size, native title bar overlay on Windows/Linux, and macOS traffic-light spacing.
- Theme supports light, dark, and system; persist the preference, synchronize Electron `nativeTheme`, and apply the root `dark` class. Mount Sonner's Toaster once at the root.
- After every change run `pnpm typecheck` and `pnpm lint`, and make sure `pnpm dev` starts cleanly. Run `pnpm build` before delivering foundation or build configuration changes. Report blockers honestly; never claim blocked checks passed.

## Current documentation

Use Context7 MCP whenever working with library, framework, SDK, API, CLI, or cloud-service syntax, configuration, setup, migration, or debugging. Start with `resolve-library-id` (unless an exact `/org/project` ID is provided), choose the best official match, then call `query-docs` for the full question, scoped to one concept per call. Prefer version-specific IDs when a version is specified. General refactoring, scripts from scratch, business logic, code review, and programming concepts do not require Context7.
