# Phonivra interface implementation

Implementation only. Typecheck, lint, build, development startup, automated tests,
Playwright and screenshot review were not run, following the user's explicit
instruction to leave verification to them.

## Entry points

`pnpm dev` opens the Electron app. The initial route is `#/narrate`.
Development-only `#/reference` remains available as **Interface reference** in the sidebar.
The browser development URL cannot expose Electron's preload API; it now shows
an explanatory startup screen. A missing or stale bridge in Electron also shows
an actionable startup error instead of dereferencing `window.api.theme`.
Restart the dev process after changes to main/preload code.

All six screens are implemented: Narrate, Voices, Models, Batch, Library and
Settings. The user approved Narrate and authorized completing the remaining
screens without intermediate gates. The reference
route and development handlers are unavailable in packaged builds.

## Contract and replacement boundary

- `studio.ts`: typed data, commands, job states and subscriptions.
- `api.ts`: existing desktop bridge extended with narrow studio and review methods.
- `validation.ts`: IPC input validation; no arbitrary channels or raw events.
- `data/catalog.ts`: model capabilities, language/voice catalogs and setting schema.
- `data/fixtures.ts`: curated scenario snapshots and mock output bundles.
- `data/inventory-fixtures.ts`: inventory descriptions and verbatim 6.13 messages.
- `../main/mock-studio.ts`: in-memory adapter. No TTS, recording, file reads/writes,
  downloads, folder opening, model loading, or actual audio playback.
- `../renderer/src/lib/actions.ts`: renderer action/notification boundary.

The future backend replaces the adapter behind these methods. The renderer never
imports Node/Electron. Existing security, native chrome, minimum window size,
theme synchronization and root Sonner mount are retained.

Model download management and streaming, completion retention after batch stop,
recording and OS operations are **new, needs backend work**. Provisional audio is a
state/control specimen, not an audio stream. Playback controls simulate state only.
No invented disk-size estimates are presented as real model sizes.

## Review controls

Curated scenarios start paused. Run, Pause, Advance and Reset control the mock job.
States contains all inventory edge-case fixtures. Messages contains the exact
6.13 strings, retaining legacy product names and tab/environment-variable wording.
Catalogs exposes model-specific control support and all 23 native language labels.
Lists demonstrates normal and 500-row windowed output/part lists.

Legacy bug descriptions are marked as review context, not intended product
behavior. Detailed screen-specific preflight, subtitle display, project recovery,
watermark results and batch source review will be composed at their screen gates.

## Open product decisions

The gate-1 decision register remains authoritative. Plan approval was not treated
as implicit resolution of each decision. In particular:

- Default-pause vs automatic inter-part silence and leading/trailing pauses.
- Long-script estimates, CJK limits and mixed-language/locale policy.
- Detection confirmation vs heuristic fallback.
- Fixed-sample vs script-excerpt previews and exact settings inheritance.
- Seed guarantees and Original CFG=0 backend verification.
- > =5s vs >5s reference validation, conditioning windows and reference override
  > after preset save. Current mock save explicitly retains the decision as pending.
- Voice metadata and consent requirements.
- Download pause/resume, active-model removal and license/gated access policy.
- MPS, precision, quantization, memory policies and additional model versions.
- Full subtitle text, timing, markup and unsupported reaction blocking policy.
- Project browser/autosave/version migration and reference portability.
- Streaming/cancelled-audio lifetime, durable jobs and restart recovery.
- Preview retention, WAV metadata parity and expanded output settings.
- Library search, history cap, pagination and bulk management.
- Persistence/apply behavior, reset boundaries and imported numeric ranges.
- Dictionary replacement, Hindi ordinals, import parsing and optional preprocessors.
- Credential storage/log retention and replacement of legacy error wording.

Numeric input currently uses the inventory's UI ranges. Imported wider values
must receive an explicit correction workflow rather than silent coercion later.
Host/share, launcher, desktop entries, Gradio and `/config` remain out of scope.

## Skills and documentation

The full frontend playbook was installed using the skill-installer helper from:
https://github.com/openai/skills/tree/30444aed500c00c85294d12074f6e3ee794f808a/skills/.curated/frontend-skill

It is installed at `/home/siyan/.codex/skills/frontend-skill`. This is the last
available official revision; the local catalogue pointer remains untouched.
All four requested design skills were read. The plan's neutral semantic tokens,
Inter, restraint and accessible shadcn composition take precedence over marketing
or alternate-stack recommendations. The earlier design-system searches returned
marketing patterns; no unverified generated design system was persisted.

Official Electron pages relied upon:

- https://www.electronjs.org/docs/latest/tutorial/security
- https://www.electronjs.org/docs/latest/tutorial/context-isolation
- https://www.electronjs.org/docs/latest/tutorial/process-model
- https://www.electronjs.org/docs/latest/tutorial/dark-mode
- https://www.electronjs.org/docs/latest/api/dialog

shadcn MCP supplied official component discovery and add commands. Components were
added using the project's official shadcn CLI without overwriting existing files;
`cmdk` is required by the explicitly requested Command/searchable-selector primitive.

## Completed screen pass

- Voices: windowed catalog, source filters, audition, effective voice selection,
  reference recording/upload, custom preset save/delete, model/language preview.
- Models: integrated catalog, Auto explanation, install/remove, progress,
  pause/resume/cancel/retry, model capability table and language details.
- Batch: explicit file/text sources, mock file import, chapter review, inherited
  settings, sequential unit status/errors, completed exports retained after Stop.
- Library: windowed newest-first selection, audio and companions, metadata/settings
  snapshot/parts, watermark result panel, confirmed output deletion and folder access.
- Settings: appearance, device, all generation defaults, dictionary, cache folder,
  optional credential connection, preview cleanup and local diagnostics.

All screens have development-only review tools with the full inventory fixture
list. The additional model lifecycle, storage, credential, diagnostics, cleanup,
ZIP and batch plan actions are typed mock operations. No real files, credentials,
model weights or clipboard contents are read or written by these mock actions.
Appearance retains its existing working desktop persistence.

`COVERAGE.md` maps features, workflows, settings, states, limits and exact error
messages and records remaining backend work and unresolved product decisions.
No compilation, lint, tests, app launch or screenshots were performed for this
pass, at the user's request. Source formatting is not runtime verification.
