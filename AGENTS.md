# Phonivra

Phonivra is a local-first text-to-speech studio. This guide applies across the monorepo. Before editing a workspace, read its guide and any deeper `AGENTS.md` on the path to the files you will change. For cross-workspace changes, read each affected guide.

| Workspace                          | Package             | Owns                                         |
| ---------------------------------- | ------------------- | -------------------------------------------- |
| [Desktop](apps/desktop/AGENTS.md)  | `phonivra`          | Electron app, native integration, installers |
| [Engine](apps/engine/AGENTS.md)    | `@phonivra/engine`  | Local speech synthesis, jobs, storage, media |
| [Website](apps/website/AGENTS.md)  | `@phonivra/website` | Public marketing site                        |
| [Shared UI](packages/ui/AGENTS.md) | `@phonivra/ui`      | Browser-safe components, hooks, and theme    |

## Development

- Run workspace commands from the repository root unless a guide specifies otherwise. Use the Node range and pnpm version declared in [package.json](package.json). Install existing dependencies with `pnpm install --frozen-lockfile`. Update lockfiles through their package managers.
- Use the affected workspace's checks for scoped changes. For cross-workspace code or shared tooling changes, use the applicable CI checks: `pnpm typecheck`, `pnpm lint`, `pnpm build`, and `pnpm format:check`. See [CI](.github/workflows/checks.yml) and the [development guide](README.md#development) for prerequisites and caching. Report any relevant checks or smoke tests you could not run.
- For current library, framework, SDK, API, CLI, or cloud-service guidance, use Context7. Resolve the library ID first unless an exact ID is supplied, then query each distinct topic with the full question. Use official documentation if Context7 is unavailable. Ordinary refactoring and business-logic debugging follow the local code.

## Shared boundaries

- Both apps consume `@phonivra/ui` through its public exports. Keep reusable primitives and theme tokens there and app-specific composition in the owning app. Use existing variants and semantic tokens.
- For changes to commands, settings, media formats, or the desktop–engine protocol, check both sides for affected types and runtime validation. The [shared contract](apps/engine/src/contract.json) owns the shared constants.
- Keep scripts, reference recordings, and generated audio on-device. Keep model-download credentials out of source, logs, and persisted studio data.
- Update the nearest guide when a change invalidates its commands or boundaries. Put shared guidance here and link to existing setup or release documentation for details.
