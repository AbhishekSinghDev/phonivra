# Phonivra Engine

The Python engine owns synthesis, model downloads, jobs, recording, and workspace storage. See the [engine README](README.md) for setup, module responsibilities, and runtime prerequisites.

## Boundaries

- Electron owns startup and shutdown. Preserve the stdin/stdout launch handshake, authenticated loopback transport, and shutdown on stdin EOF. Keep diagnostic output out of the stdout handshake.
- Keep shared protocol constants in [contract.json](src/contract.json) and Python command validation in [schemas.py](src/schemas.py). For wire changes, check the [desktop guide](../desktop/AGENTS.md) and update the affected desktop client and validators together.
- Preserve the single compute worker, job-start input snapshots, and cooperative cancellation. Discard unfinished narration on cancellation and retain completed batch items. Use [storage.py](src/storage.py) for app-owned paths and atomic JSON writes.
- Load verified local model assets using the pinned revisions and checksums in [model-assets.json](src/model-assets.json). Keep Python dependencies in `pyproject.toml` and regenerate `uv.lock` with uv when dependencies change.

## Run and verify

```sh
pnpm engine:check
pnpm engine:lint
```

The syntax check does not import the engine or run inference. For runtime changes, prepare the environment with `pnpm engine:setup` and launch through `pnpm dev:desktop`. Exercise the affected behavior with the needed model or media dependencies available. For protocol changes, also run `pnpm --filter phonivra typecheck`.
