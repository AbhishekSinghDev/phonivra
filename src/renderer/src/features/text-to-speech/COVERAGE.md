# Narrate — individual screen gate

Implementation only. Per the user's instruction, no checks, app launch, tests,
Playwright session or screenshots were run. Narrate was approved. The user then authorized implementing all remaining screens without intermediate gates. See `src/shared/COVERAGE.md` for the complete interface mapping.

Open the **Narrate** sidebar destination (`#/narrate`), now the default route.
Development-only **Review states** changes scenarios in place. The Interface
reference remains available for the full inventory fixture/message list.

## Composition

- Script-led workspace and wide-window settings inspector.
- Essential choices stay inline at smaller sizes; advanced settings, dictionary,
  reference tools and prepared text use accessible shadcn overlays.
- Persistent Generate/Stop bar, independent previous-take review and job progress.
- Light/dark semantic tokens, local Inter, reduced-motion support inherited from
  the shell. No additional styling system or hand-built control primitives.

## Inventory mapping

| Inventory                           | Narrate component                                               |
| ----------------------------------- | --------------------------------------------------------------- |
| 2.2 Script/title/import             | `parts/narration-editor.tsx`; Project menu                      |
| 2.3 Cleanup and dictionary          | Shared `AdvancedSettings`; shared `DictionaryEditor`            |
| 2.4 Pauses/reactions                | Editor insertion menu; capability warning in `NarrationNotices` |
| 2.5 Language/detection              | `NarrationSetup`; detection explanation                         |
| 2.6 Voice/reference/preview         | `VoiceTools`, shared reference and preset controls              |
| 2.7 / 3.2 Routing/parameter support | Data-driven setup and advanced controls; compatibility notice   |
| 2.8 / 7 All 28 generation settings  | Essential setup plus shared advanced inspector                  |
| 2.9 Preparation and parts           | Lazy `TextInspection`; mock API `script.inspect`                |
| 2.10 Progress/Stop                  | Sticky action bar; shared `JobStatus`                           |
| 2.11 Mastering/export               | Advanced inspector; shared output bundle                        |
| 2.12 SRT/VTT/TXT/JSON               | Shared `OutputDetails`; subtitle limitation disclosure          |
| 2.14 Completed take                 | Latest/previous take; Library navigation                        |
| 2.15 Projects                       | Project menu Save/Open; mock API boundary                       |
| 2.16 Restore defaults               | Project menu; script/dictionary/reference preserved             |
| 2.17 Device/model status            | Inspector device and installation details                       |
| 2.18 First-use download             | Download-and-generate action and job stages                     |
| 5 B/D/G/I                           | Narration, preview, portable project and cancellation flows     |
| 6.1–6.7, 6.10–6.13                  | Contextual notices, job/output states, dev fixtures/messages    |

Other workflows belong to their later screen gates, not to this screen.

## State handling

- Loading workspace skeleton and lazy inspection surface.
- Empty input can request generation, which focuses the script and presents
  the mock API's exact validation message.
- Unsupported model/language and unavailable FFmpeg combinations are explained
  inline and rejected by the mock API when generation is requested.
- Missing, short, empty and exactly-five-second references use the catalog's
  current per-model requirements and inventory error messages.
- Jobs snapshot settings and script; ongoing edits apply to the next take.
- Queued/download/load/preparation/generation/mastering/encoding/companions,
  cancellation request, stopped, failed and complete states remain inspectable.
- Provisional streaming playback is separate from the final mastered output.
- Preview completion has its own player and no companion exports.
- Latest finished output remains labeled Previous take during another job.
- Source/processed text remain separate. Inspection is an illustrative mock, not
  a new implementation of the old normalization/chunking algorithms.
- Input stays synchronous; IPC draft writes are coalesced and flushed before
  generation, inspection, import and save. Word statistics are deferred.

## Backend work and unsettled behavior

All generation, preview audio, playback, recording, importing, project operations,
model downloads, inspection and export remain mock actions behind `window.api`.
Streaming, download management and prepared-text inspection need backend work.
The dev UI and implementation notes identify those limitations.

The gate-1 open-product-decision register remains pending. No new guarantees of
seed determinism, full-text subtitle preservation, model licensing, preview setting
parity, project portability or automatic inter-part pauses are made by this UI.
Reaction insertion is disabled on unsupported models; existing tags receive a
warning while the block-vs-warn product decision remains open. Voice references
continue to override presets visibly until cleared.

No Electron window/security behavior was changed in this screen pass. The
previously documented Electron security/context-isolation guidance remains the
basis of the existing typed API boundary.
