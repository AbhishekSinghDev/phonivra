# Desktop

## Boundaries to preserve

- Renderer code must not import Node/Electron. OS access goes through the typed
  `window.api` in `src/preload/index.ts`; never expose raw IPC or arbitrary channels.
- Keep `contextIsolation`, `sandbox` and `webSecurity` enabled,
  `nodeIntegration` and `webviewTag` disabled. Preserve navigation/redirect/webview
  blocking, denied permissions and credential-free HTTP(S) external URL validation.
- Every main-process IPC handler must check sender trust and validate input.
  `src/shared/{api,studio,validation}.ts` is the future engine replacement boundary;
  change contract, runtime validation and bridge together, not just renderer types.
  These contracts remain private to this app.
- The sandboxed preload must remain CommonJS (`out/preload/index.cjs`) despite
  the ESM package. Keep its build format and the main-process preload path aligned.
- Preserve the CSP in `src/renderer/index.html` and the dev nonce in
  `electron.vite.config.ts`; never allow inline production scripts. The trusted
  dev renderer is exactly `http://127.0.0.1:5173`; production loads a local file.
- Preserve app identity and persistence: `appearance.json` under Electron userData
  (mode `0o600`) and Zustand's `phonivra-shell` key. Theme is owned by main/nativeTheme
  and pushed over IPC, not independently persisted in the renderer.
- Keep the native title bar overlays/macOS traffic-light spacing, 960×640 minimum,
  show-on-ready behavior and theme-matched window background. Window control IPC is
  intentionally a stub; native controls already perform the actions.

## Working with the studio

`src/main/mock-studio.ts` is an in-memory adapter: audio, recordings, model downloads
and project/file operations are simulated. No local speech engine or installer
packaging exists. Do not implement real IO in renderer components to work around it.
Use `../../docs/FEATURES.md` for audited flows and limitations, and
`../../docs/electron.txt` for Electron security/performance references.

- Feature actions go through `src/renderer/src/lib/actions.ts`; its draft flush
  prevents generation/save/import from racing the debounced editor text.
- Snapshot revisions are monotonic; retain stale-revision rejection and unchanged
  slice identities in `stores/studio-store.ts` to avoid progress-driven rerenders.
  Use narrow Zustand selectors rather than subscribing to the whole store.
- Keep `HashRouter` and lazy feature screens: production runs from `file://`.
  Reuse `components/studio` across features instead of importing another feature's parts.

## Run and verify

From the repo root:

```sh
pnpm dev:desktop
pnpm --filter phonivra typecheck
pnpm --filter phonivra lint
pnpm --filter phonivra build
```

Development needs a graphical Electron session and a free port 5173. A browser tab
at the renderer URL intentionally shows a missing-desktop-API error; it is not an
Electron smoke test. Exercise affected actions in the native window, including
draft flush, progress/cancellation and confirmation flows where relevant.
The root build command also checks both main/preload and renderer TypeScript.
