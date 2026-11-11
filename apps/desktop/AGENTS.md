# Phonivra Desktop

Electron owns native dialogs, clipboard and filesystem integration, theme state, encrypted download credentials, and the engine lifecycle. The renderer calls the typed `window.api` from [preload](src/preload/index.ts). The [engine client](src/main/engine-client.ts) launches the Python process and keeps its loopback port and session secret in main. Renderer playback uses the restricted `phonivra://media` origin.

## Boundaries

- Keep Node and Electron APIs in main/preload. Expose specific methods through the bridge, verify trusted senders in main, and validate IPC payloads at runtime. Preserve sandboxing, context isolation, web security, CSP, and navigation and permission restrictions.
- Keep the CommonJS preload output and BrowserWindow preload path aligned. Production uses the `phonivra://app` origin. Preserve hash routing and the explicit loopback development origin defined in [contract.ts](src/shared/contract.ts).
- For studio command or snapshot changes, check [shared types](src/shared/studio.ts), [IPC validation](src/shared/validation.ts), and the preload bridge. For engine-facing changes, also read the [engine guide](../engine/AGENTS.md).
- Route studio actions through [actions.ts](src/renderer/src/lib/actions.ts). Preserve the draft flush before actions that read or replace editor content and the snapshot store's stale-revision guard. Keep playback coordinated through [playback.ts](src/renderer/src/lib/playback.ts).

## Run and verify

```sh
pnpm engine:setup
pnpm dev:desktop
pnpm --filter phonivra typecheck
pnpm --filter phonivra lint
pnpm --filter phonivra build
```

Engine setup is required for a fresh native development environment. Smoke-test affected flows in an Electron window with the prepared engine. For packaging or runtime staging, use the [release guide](RELEASE.md). For edits to packaging Python scripts, CI also runs `uvx --from ruff==0.17.4 ruff check apps/desktop/scripts`.
