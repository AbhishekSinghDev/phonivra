# Phonivra

## Monorepo scope

The pnpm/Turborepo workspace contains `apps/desktop` (package `phonivra`) and
`apps/website` (package `@phonivra/website`), plus `packages/ui` (`@phonivra/ui`). Root scripts run checks and builds across
the apps and shared UI package; `pnpm dev:desktop` and `pnpm dev:website` select one app. Root `pnpm format`
formats the entire repository. The root owns shared oxlint/oxfmt tooling and configuration;
all workspaces extend the root lint baseline and explicitly reference the formatter config.
Keep framework dependencies and TypeScript configs inside their app. Shared UI dependencies
belong in `packages/ui`, with React/React DOM as peers. Do not introduce shared packages
without actual reuse.

Shared shadcn components, browser-only UI hooks/helpers, and visual styles live in
`packages/ui/src`. Import them via `@phonivra/ui/components/*`, `@phonivra/ui/hooks/*`,
`@phonivra/ui/lib/*`, and `@phonivra/ui/globals.css`. Both apps must use this package;
do not add local component or theme copies. Add/update components with the official CLI
from `packages/ui`, as documented in `README.md`. No Electron, IPC, app stores or app
imports are permitted in the UI package. Pass app-owned theme values through props.

The desktop rules below apply within `apps/desktop`; their `src/`, config and component
paths are relative to that directory. Electron IPC, security, action/store and theme rules
are desktop-specific. The website uses Next.js App Router with Tailwind v4, strict TypeScript,
semantic tokens and the shared shadcn package. Keep its scaffold minimal and independent of
the Electron implementation. General working, TypeScript and React rules apply to both apps,
except Next.js requires default exports for its framework entry files.

UI-first Electron text-to-speech desktop app. Speech generation is not implemented: `src/main/mock-studio.ts` simulates jobs, voices, models and outputs so the UI can be built before a backend exists. The mock is a replaceable adapter behind the typed contract in `src/shared/`.

Stack: Electron + electron-vite, React 19, strict TypeScript, Tailwind CSS v4 (Vite plugin), shadcn/ui (new-york), Hugeicons (`@hugeicons/react` + `@hugeicons/core-free-icons`), Sonner, Zustand, react-router `HashRouter`, pnpm, ChaiUI typography (Manrope, Montserrat and Onest, bundled locally). Node 24 (see `.nvmrc` and `engines`).

Workspace layout, commands and task caching are documented in `README.md`. This file holds binding rules; if the two conflict, fix `README.md`.

## Desktop commands

Run these inside `apps/desktop`. At the root, the corresponding commands cover both apps.

```sh
pnpm dev          # Electron window + dev server
pnpm typecheck    # tsc --noEmit for node + web configs
pnpm lint         # oxlint --deny-warnings
pnpm build        # typecheck + electron-vite build
pnpm format       # oxfmt --write .
```

## Definition of done

A change is done only when all of these are true:

1. `pnpm typecheck` and `pnpm lint` pass with zero errors and zero warnings.
2. `pnpm dev` starts with no console errors or warnings from your change.
3. `pnpm build` passes if you touched build config, `package.json`, tsconfigs, ESLint config, the preload, or the main process.
4. Light and dark mode both checked for any UI change.
5. Affected docs are updated (see Documentation).

Report any check you could not run, and why. Never state or imply a check passed unless you ran it and saw it pass.

## Working rules

- Read the surrounding code and the existing pattern before writing. Match it. Do not introduce a second way to do something that already has a way.
- Do exactly what was asked. No unrequested refactors, renames, reformatting of untouched code, or "while I'm here" changes. If you spot a real problem outside scope, mention it and stop.
- Do not add abstractions, helpers, props, options, or config for hypothetical future use. Three similar lines beat a premature abstraction.
- Do not leave dead code, unused exports, commented-out code, TODOs without an owner, or placeholder files.
- Comments explain non-obvious _why_ only. Never narrate what the code does. Never leave comments describing your own edits.
- Do not create summary, notes, or planning markdown files. Only update the docs listed under Documentation.
- If a requirement is ambiguous or conflicts with these rules, ask. Do not guess and do not silently pick.
- Do not run `git commit`, `git push`, or change git config unless asked.

## Boundaries

**Always**

- Use pnpm only.
- Route every feature action through `lib/actions.ts` (it calls `notify(...)` then dispatches a typed `StudioCommand`). Stub UI actions call `notify("<Action> clicked")` from `lib/notify.ts`.
- Validate every IPC payload with `src/shared/validation.ts` in the main process. Check sender trust with `assertTrusted`.
- Gate dev-only code with `import.meta.env.DEV` so it is absent from packaged builds.
- Fix the root cause of a lint or type error.

**Ask first**

- Adding, removing, or upgrading any dependency (including shadcn components that pull in new packages beyond the component's own).
- Changing `package.json` scripts, `electron.vite.config.ts`, tsconfigs, `.oxlintrc.json`, `.oxfmtrc.json`, or `pnpm-workspace.yaml`.
- Changing anything in `src/shared/api.ts`, `studio.ts`, or `validation.ts`. This is the replacement boundary for the future backend.
- Adding a new route, store, or top-level folder.
- Any `oxlint-disable`, `@ts-ignore`, or `@ts-expect-error`. If approved, it needs a one-line reason and the narrowest scope.

**Never**

- Import Node or Electron modules in the renderer. All OS access goes through typed `window.api`.
- Expose raw IPC channels, arbitrary events, or `ipcRenderer` from preload.
- Loosen security (see Security).
- Hand-write shadcn lookalikes or edit shared primitives for styling. Add missing primitives with the official `shadcn` CLI only.
- Use hardcoded colors, arbitrary Tailwind values, `style={{}}` for static styling, fonts outside the ChaiUI family, or CDN requests.
- Use `localStorage` directly. Persisted UI state uses Zustand `persist`; theme is owned by the main process.
- Hand-edit lockfiles or generated files.

## TypeScript

- `strict` everywhere. No `any`. Use `unknown` and narrow.
- No type assertions (`as X`) or non-null `!`, except `as const` and at a validated boundary with a comment. Prefer type guards and validators.
- Types are derived from `src/shared/` where they cross process boundaries. Do not redeclare them locally.
- Use `import type` for type-only imports. Prefer union literal types over `enum`.
- Prefer `function name(): Return {}` declarations. Exported functions have explicit return types.
- No floating promises. Use `void` only when intentionally unawaited, with a comment for swallowed failures.
- `catch (error: unknown)`, then narrow with `error instanceof Error`. Failures surface through the store (`setError`) or `notify`. Never swallow silently.
- Mark intentionally unused parameters with a leading underscore (`_event`).
- Oxfmt: no semicolons, single quotes, no trailing commas, 100 columns. Never hand-format against it.

## React

- Components declare `React.JSX.Element` as return type. One component per file unless tiny and private to it.
- Named exports. The only default exports are route `page.tsx` files consumed by `React.lazy`.
- Do not use `useEffect` to derive state, respond to events, or sync props to state. Compute during render or handle in the event handler. Effects are for external systems only (subscriptions, DOM, IPC listeners) and must clean up.
- Do not add `useMemo` / `useCallback` / `memo` without a measured reason stated in a comment.
- Read Zustand with narrow atomic selectors: `useStudioStore((s) => s.snapshot)`. Never subscribe to the whole store. Selectors that build new objects or arrays are not allowed.
- Keep state as local as possible. Server-like data comes from the studio snapshot. Do not copy snapshot data into component state.
- Do not mutate store state, props, or snapshot slices. The store preserves referential identity of unchanged slices; do not break it.
- Every async path has a loading, empty, and error state, built from `Skeleton`, `Empty`, and `notify`/store error.
- Every list renders with stable, unique keys. Never use array index when items can reorder.
- Accessibility: icon-only buttons have `aria-label`. Use semantic elements and Radix behavior; never `div` with `onClick`.

## Architecture and placement

| What                               | Where                                                         |
| ---------------------------------- | ------------------------------------------------------------- |
| shadcn primitives                  | `packages/ui/src/components/` (repo-relative, CLI-maintained) |
| Shared composites                  | `components/` and `components/studio/`                        |
| Screens                            | `features/<name>/page.tsx` plus `features/<name>/parts/*.tsx` |
| Stores                             | `stores/` (one per concern)                                   |
| Action boundary, notify, utilities | `lib/`                                                        |
| Hooks                              | `hooks/`                                                      |
| Cross-process types and validators | `src/shared/`                                                 |

- Features import their own parts relatively (`./parts/x`). App-local code uses the `@/` alias; shared UI uses `@phonivra/ui` exports.
  Cross-process desktop shared code is imported by relative path.
- Features never import from another feature's folder. Move shared code to `components/`, `lib/`, or `hooks/`.
- Mutable module state is allowed only in small, commented modules (currently `lib/actions.ts` draft buffers).
- Every screen stays lazy-loaded with `React.lazy` and the `Suspense` Skeleton fallback.
- The renderer works against `window.api` and the snapshot contract only. When real behavior replaces `MockStudio`, no renderer code should need to change. Do not leak mock details into the UI.
- Push-notified state is full snapshots with a monotonic `revision`. Ignore stale revisions.

## Security (non-negotiable)

- `contextIsolation: true`, `nodeIntegration: false`, `sandbox: true`, `webSecurity: true`, `webviewTag: false`.
- Strict CSP in `index.html`. No inline script allowance in production. The dev nonce applies to the dev preamble only.
- Block renderer navigation, redirects, webviews, and new windows. Disable file-drop navigation and pinch/keyboard zoom.
- Validate URLs (http/https only, no embedded credentials) before `shell.openExternal`.
- Deny all permission requests and checks by default.
- Preload is built as CommonJS (`.cjs`), exposes exactly one object (`window.api`), and subscriptions return unsubscribe functions.
- Main-process handlers never trust renderer input. Validate sender and payload every time.
- Dev renderer URL must be `http://127.0.0.1:5173`. Production loads a local `file://`.

## Window and theme

- Preserve `show: false` then show on `ready-to-show`, theme-matched native background, minimum size 960x640, title bar overlay on Windows/Linux, macOS traffic-light spacing.
- Theme is light, dark, or system. The main process persists it (`appearance.json`, mode `0o600`), syncs `nativeTheme`, and pushes it over IPC. `ThemeProvider` applies the root `dark` class and `colorScheme`.
- Native window colors must match the neutral semantic palette (CSS variables cannot be used there).
- Mount `Toaster` once and `TooltipProvider` once, both in `App.tsx`.
