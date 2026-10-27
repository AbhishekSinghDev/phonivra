# Phonivra

Foundation source for a UI-first Electron desktop text-to-speech app. No speech generation, backend, voice management, history storage, or settings features are implemented.

## Setup status — incomplete

This session could not resolve `registry.npmjs.org` (`ENOTFOUND`), including after network access was requested. Source and configuration have been prepared in the project root, but **the app is not yet runnable or verified**.

Outstanding work:

- Run the official electron-vite React TypeScript scaffold. The requested command was attempted but failed before downloading. Because the root now contains prepared source, scaffold in a temporary directory and integrate the template while preserving this source and the security settings.
- Install the current package manager and dependencies with pnpm; commit the resulting lockfile. Dependencies currently use stable release tags or the requested major constraints because registry resolution has not completed.
- Run `pnpm dlx shadcn@latest init` with neutral, CSS variables, the renderer aliases, and Radix components. The CLI was attempted but could not download. `components.json` records the intended configuration; it does not indicate successful CLI initialization.
- Add `button` and `sonner` through the official shadcn CLI. Their generated files in `components/ui/` and `lib/utils.ts` are intentionally absent until the CLI runs. Do not substitute hand-written components. Preserve Inter and the desktop CSS when the CLI updates the stylesheet.
- Adapt the generated Sonner component to import `useTheme` from `@/hooks/use-theme` rather than adding `next-themes`; the root passes the resolved theme. Do not install an unrequested theme dependency.
- Run `pnpm format`, `pnpm typecheck`, `pnpm lint`, and `pnpm build`. Verify `pnpm dev`, every route, collapse, theme persistence/system changes, and Generate toasts in light and dark themes inside Electron, including a production `file://` launch.

`pnpm install`, `pnpm typecheck`, `pnpm lint`, `pnpm dev`, and `pnpm build` were attempted but blocked before execution by the package-manager download's DNS failure. No build or runtime check has passed. Configuration JSON files parse successfully.

## Toolchain

Use Node 24 LTS (`nvm install && nvm use`) and the pinned pnpm release from `packageManager`. The host currently has Node 24.12.0, below the prepared engine requirement, and pnpm 10.33.0. Install a current LTS patch before verification.

Current pnpm removed `onlyBuiltDependencies` in v11. The equivalent `allowBuilds` configuration in `pnpm-workspace.yaml` explicitly permits Electron, esbuild, and Tailwind oxide installation scripts. See the [official migration documentation](https://pnpm.io/settings/build#allowbuilds).

## Commands

```sh
pnpm install
pnpm dev
pnpm typecheck
pnpm lint
pnpm build
pnpm format
```

## Structure and decisions

- `src/main`: secure window lifecycle, validated external navigation, theme persistence and native appearance synchronization. Native window overlay controls work through Electron; the exposed custom window control API is deliberately a stub.
- `src/preload`: a sandbox-compatible CommonJS context bridge exposing the typed API from `src/shared/api.ts`. Theme IPC is implemented because native appearance synchronization requires it; feature actions remain stubs.
- `src/renderer/src/components`: title bar, collapsible sidebar, and ThemeProvider. Shell actions work and also announce their placeholder action via `notify`.
- `src/renderer/src/features`: four minimal placeholder pages.
- `src/renderer/src/stores`: Zustand shell state; sidebar collapse persists in localStorage. Theme preference persists in Electron's user-data directory so the window can use the correct background before rendering.
- `src/renderer/src/lib/notify.ts`: the single Sonner notification entry point. The root mounts one themed Toaster.
- HashRouter preserves routing under `file://`. Inter is imported locally; there are no CDN requests.

The renderer CSP allows only local scripts, fonts, and images, plus the fixed loopback Vite HMR connection. React's development preamble receives a random nonce when the dev config starts; production has no inline script allowance. Inline styles are required by the Vite CSS runtime and Sonner's injected styles. Native colors use the neutral palette because Electron window options cannot consume CSS variables. The title bar reserves space for macOS traffic lights and Windows/Linux window controls.

See `AGENTS.md` for rules that apply to future changes.
