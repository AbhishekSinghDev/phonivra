import type { FixtureDefinition, MessageDefinition } from '../studio'

// Exact inventory messages. Legacy product names are intentionally retained.
export const inventoryMessages: readonly MessageDefinition[] = [
  {
    id: 'message-01',
    section: '6.13',
    message: 'Add a script on the left, then generate your narration.'
  },
  {
    id: 'message-02',
    section: '6.13',
    message: 'Paste narration or upload a script first.'
  },
  {
    id: 'message-03',
    section: '6.13',
    message: 'The script is empty after text cleanup.'
  },
  {
    id: 'message-04',
    section: '6.13',
    message: 'Please choose a supported language.'
  },
  {
    id: 'message-05',
    section: '6.13',
    message: 'Please choose a supported model.'
  },
  {
    id: 'message-06',
    section: '6.13',
    message: '<Model> is English-only. Choose Multilingual V3 or Auto for <Language>.'
  },
  {
    id: 'message-07',
    section: '6.13',
    message:
      'The GPU ran out of memory while loading this model. Try Chatterbox Nano, a shorter script, or CPU mode.'
  },
  {
    id: 'message-08',
    section: '6.13',
    message: 'A generation is already running in this tab.'
  },
  {
    id: 'message-09',
    section: '6.13',
    message: 'No generation is running in this tab.'
  },
  {
    id: 'message-10',
    section: '6.13',
    message: 'Stopping after the current step…'
  },
  {
    id: 'message-11',
    section: '6.13',
    message: 'Stopped. The unfinished take was discarded.'
  },
  {
    id: 'message-12',
    section: '6.13',
    message: 'Could not generate audio: …'
  },
  {
    id: 'message-13',
    section: '6.13',
    message: 'Could not create preview: …'
  },
  {
    id: 'message-14',
    section: '6.13',
    message: 'Preview stopped.'
  },
  {
    id: 'message-15',
    section: '6.13',
    message:
      'This model needs a voice reference. Choose a preset or upload a clean WAV of at least 6 seconds.'
  },
  {
    id: 'message-16',
    section: '6.13',
    message:
      'The reference recording is X.Xs; Chatterbox needs at least 5 seconds (6+ recommended).'
  },
  {
    id: 'message-17',
    section: '6.13',
    message: 'Audio prompt must be longer than 5 seconds!'
  },
  {
    id: 'message-18',
    section: '6.13',
    message: 'The reference recording is empty.'
  },
  {
    id: 'message-19',
    section: '6.13',
    message: 'The reference recording must be at least 5 seconds long.'
  },
  {
    id: 'message-20',
    section: '6.13',
    message: 'The uploaded reference recording is no longer available. Please upload it again.'
  },
  {
    id: 'message-21',
    section: '6.13',
    message: 'That voice is no longer available. Refresh the voice list and choose another.'
  },
  {
    id: 'message-22',
    section: '6.13',
    message: 'The selected voice reference file is missing.'
  },
  {
    id: 'message-23',
    section: '6.13',
    message: 'Upload or record a reference clip first.'
  },
  {
    id: 'message-24',
    section: '6.13',
    message: 'Tick the confirmation box before deleting a custom preset.'
  },
  {
    id: 'message-25',
    section: '6.13',
    message: 'Only custom presets saved in this app can be deleted here.'
  },
  {
    id: 'message-26',
    section: '6.13',
    message: 'That custom preset was not found.'
  },
  {
    id: 'message-27',
    section: '6.13',
    message: 'ffmpeg is required for this output format or sample rate.'
  },
  {
    id: 'message-28',
    section: '6.13',
    message: 'Unsupported output format: …'
  },
  {
    id: 'message-29',
    section: '6.13',
    message: 'ffmpeg failed'
  },
  {
    id: 'message-30',
    section: '6.13',
    message: 'Upload one or more scripts, or paste a chaptered script.'
  },
  {
    id: 'message-31',
    section: '6.13',
    message: 'No text was found to generate.'
  },
  {
    id: 'message-32',
    section: '6.13',
    message: 'No batch items finished. …'
  },
  {
    id: 'message-33',
    section: '6.13',
    message: 'Batch stopped after N finished part(s).'
  },
  {
    id: 'message-34',
    section: '6.13',
    message: 'Tick the confirmation box first.'
  },
  {
    id: 'message-35',
    section: '6.13',
    message: 'That file was not found.'
  },
  {
    id: 'message-36',
    section: '6.13',
    message: 'Choose a Chatterbox project JSON file first.'
  },
  {
    id: 'message-37',
    section: '6.13',
    message: 'This is not a Chatterbox Narrator project file.'
  },
  {
    id: 'message-38',
    section: '6.13',
    message: 'No file selected.'
  },
  {
    id: 'message-39',
    section: '6.13',
    message: 'Supported script types: .txt, .md, .markdown, .srt, .vtt'
  },
  {
    id: 'message-40',
    section: '6.13',
    message: 'No saved narrations yet.'
  },
  {
    id: 'message-41',
    section: '6.13',
    message: 'Select a saved narration.'
  },
  {
    id: 'message-42',
    section: '6.13',
    message: 'Watermark check needs the Perth package: …'
  },
  {
    id: 'message-43',
    section: '6.13',
    message: 'Watermark not detected: 0.xx. The file may have been re-encoded or edited heavily.'
  },
  {
    id: 'message-44',
    section: '6.13',
    message: 'Could not check the watermark: …'
  },
  {
    id: 'message-45',
    section: '6.13',
    message: 'Could not open the folder: …'
  },
  {
    id: 'message-46',
    section: '6.13',
    message: 'CHATTERBOX_DEVICE must be auto, cpu, or cuda.'
  },
  {
    id: 'message-47',
    section: '6.13',
    message:
      'NVIDIA GPU is not available. Reboot after installing the driver, or run with CHATTERBOX_DEVICE=cpu.'
  }
]

// Review descriptions document old edge cases; legacy defects are not normal behavior.
export const inventoryFixtures: readonly FixtureDefinition[] = [
  {
    id: 'inventory-6.1-01',
    section: '6.1',
    label: 'First launch',
    description:
      'First launch: directories/settings/dictionary load; history refresh; no model loaded yet.',
    phase: 'idle',
    legacy: false
  },
  {
    id: 'inventory-6.1-02',
    section: '6.1',
    label: 'Model loading',
    description:
      'Model loading: first generation may show “Loading <model> — time estimate starts after loading.” No download progress in the UI.',
    phase: 'loading',
    legacy: false
  },
  {
    id: 'inventory-6.1-03',
    section: '6.1',
    label: 'Model download',
    description:
      'Model download: can take minutes; only terminal/log progress; no cancel/pause/resume.',
    phase: 'downloading',
    legacy: false
  },
  {
    id: 'inventory-6.1-04',
    section: '6.1',
    label: 'CUDA unavailable with CHATTERBOX_DEVICE=cuda',
    description:
      'CUDA unavailable with CHATTERBOX_DEVICE=cuda: startup error “NVIDIA GPU is not available. Reboot after installing the driver, or run with CHATTERBOX_DEVICE=cpu.”',
    phase: 'error',
    legacy: false
  },
  {
    id: 'inventory-6.1-05',
    section: '6.1',
    label: 'Invalid device',
    description: 'Invalid device: “CHATTERBOX_DEVICE must be auto, cpu, or cuda.”',
    phase: 'idle',
    legacy: false
  },
  {
    id: 'inventory-6.1-06',
    section: '6.1',
    label: 'Launcher failure',
    description:
      'Launcher failure: waits 120 seconds, then shows a desktop error dialog pointing to server.log.',
    phase: 'error',
    legacy: false
  },
  {
    id: 'inventory-6.1-07',
    section: '6.1',
    label: 'OOM while loading',
    description:
      'OOM while loading: “The GPU ran out of memory while loading this model. Try Chatterbox Nano, a shorter script, or CPU mode.”',
    phase: 'loading',
    legacy: false
  },
  {
    id: 'inventory-6.1-08',
    section: '6.1',
    label: 'OOM during generation',
    description: 'OOM during generation: surfaces as “Could not generate audio: …” and is logged.',
    phase: 'idle',
    legacy: false
  },
  {
    id: 'inventory-6.1-09',
    section: '6.1',
    label: 'CPU-only',
    description: 'CPU-only: allowed; may be very slow for long scripts.',
    phase: 'idle',
    legacy: false
  },
  {
    id: 'inventory-6.1-10',
    section: '6.1',
    label: 'No streaming',
    description: 'No streaming: no partial audio until the whole job completes.',
    phase: 'idle',
    legacy: true
  },
  {
    id: 'inventory-6.2-01',
    section: '6.2',
    label: 'Empty script',
    description:
      'Empty script: “Add a script on the left, then generate your narration.” The editor is focused.',
    phase: 'idle',
    legacy: false
  },
  {
    id: 'inventory-6.2-02',
    section: '6.2',
    label: 'Only whitespace/emoji/pause markers',
    description:
      'Only whitespace/emoji/pause markers: “Paste narration or upload a script first.” or “The script is empty after text cleanup.”',
    phase: 'idle',
    legacy: false
  },
  {
    id: 'inventory-6.2-03',
    section: '6.2',
    label: 'Unsupported import type',
    description:
      'Unsupported import type: “Supported script types: .txt, .md, .markdown, .srt, .vtt.”',
    phase: 'idle',
    legacy: false
  },
  {
    id: 'inventory-6.2-04',
    section: '6.2',
    label: 'No file selected',
    description: 'No file selected: “No file selected.”',
    phase: 'idle',
    legacy: false
  },
  {
    id: 'inventory-6.2-05',
    section: '6.2',
    label: 'Import success',
    description: 'Import success: “Loaded <filename> · <n> characters.”',
    phase: 'idle',
    legacy: false
  },
  {
    id: 'inventory-6.2-06',
    section: '6.2',
    label: 'No text length limit',
    description: 'No text length limit: a very long script is accepted and chunked; no warning.',
    phase: 'idle',
    legacy: false
  },
  {
    id: 'inventory-6.2-07',
    section: '6.2',
    label: 'CJK chunking',
    description:
      'CJK chunking: sentence splitting requires whitespace after 。/！/？; long Chinese/Japanese text can be hard-chopped at the character limit rather than sentence boundaries.',
    phase: 'idle',
    legacy: false
  },
  {
    id: 'inventory-6.2-08',
    section: '6.2',
    label: 'Pause markers',
    description:
      'Pause markers: [pause], <pause>, [pause=1.5]; non-numeric markers remain literal; leading pause is dropped; final pause is dropped.',
    phase: 'idle',
    legacy: false
  },
  {
    id: 'inventory-6.2-09',
    section: '6.2',
    label: 'Pause-between-parts',
    description:
      'Pause-between-parts: changing gap without explicit markers does not insert silence between auto-split chunks.',
    phase: 'idle',
    legacy: false
  },
  {
    id: 'inventory-6.2-10',
    section: '6.2',
    label: 'Part preview with gap=0',
    description:
      'Part preview with gap=0: the preview helper falls back to 0.38 when gap is falsy, so preview can show a different pause than generation.',
    phase: 'idle',
    legacy: false
  },
  {
    id: 'inventory-6.2-11',
    section: '6.2',
    label: 'Markdown chapter bug',
    description:
      'Markdown chapter bug: uploaded .md with strip enabled becomes one batch unit instead of chapters.',
    phase: 'idle',
    legacy: true
  },
  {
    id: 'inventory-6.2-12',
    section: '6.2',
    label: 'HTML/SSML',
    description:
      'HTML/SSML: no SSML; <pause> is the only angle-bracket control recognized; other tags are stripped only if Markdown stripping is on.',
    phase: 'idle',
    legacy: false
  },
  {
    id: 'inventory-6.3-01',
    section: '6.3',
    label:
      'Explicit Turbo/Nano/Original + non-English language → “<Model> is English-only. Choose Mul',
    description:
      'Explicit Turbo/Nano/Original + non-English language → “<Model> is English-only. Choose Multilingual V3 or Auto for <Language>.”',
    phase: 'idle',
    legacy: false
  },
  {
    id: 'inventory-6.3-02',
    section: '6.3',
    label: 'Auto + English → Turbo; Auto + non-English → Multilingual.',
    description: 'Auto + English → Turbo; Auto + non-English → Multilingual.',
    phase: 'idle',
    legacy: false
  },
  {
    id: 'inventory-6.3-03',
    section: '6.3',
    label:
      'Auto-detect on + an English-only model + detected non-English text → generation error at r',
    description:
      'Auto-detect on + an English-only model + detected non-English text → generation error at run time.',
    phase: 'error',
    legacy: false
  },
  {
    id: 'inventory-6.3-04',
    section: '6.3',
    label: 'Invalid language → “Please choose a supported language.”',
    description: 'Invalid language → “Please choose a supported language.”',
    phase: 'idle',
    legacy: false
  },
  {
    id: 'inventory-6.3-05',
    section: '6.3',
    label: 'Invalid model → “Please choose a supported model.”',
    description: 'Invalid model → “Please choose a supported model.”',
    phase: 'idle',
    legacy: false
  },
  {
    id: 'inventory-6.3-06',
    section: '6.3',
    label: 'top_k changed while using Multilingual/Original → no effect.',
    description: 'top_k changed while using Multilingual/Original → no effect.',
    phase: 'idle',
    legacy: false
  },
  {
    id: 'inventory-6.3-07',
    section: '6.3',
    label: 'min_p, exaggeration, or cfg_weight changed while using Turbo/Nano → no effect.',
    description: 'min_p, exaggeration, or cfg_weight changed while using Turbo/Nano → no effect.',
    phase: 'idle',
    legacy: false
  },
  {
    id: 'inventory-6.3-08',
    section: '6.3',
    label: 'Reaction tags on Multilingual/Original → ordinary text, not native reactions.',
    description: 'Reaction tags on Multilingual/Original → ordinary text, not native reactions.',
    phase: 'idle',
    legacy: false
  },
  {
    id: 'inventory-6.3-09',
    section: '6.3',
    label: 'Numbers with non-English/Hindi convert_numbers → unchanged.',
    description: 'Numbers with non-English/Hindi convert_numbers → unchanged.',
    phase: 'idle',
    legacy: false
  },
  {
    id: 'inventory-6.3-10',
    section: '6.3',
    label: 'Mixed-language script → one language marker for all parts.',
    description: 'Mixed-language script → one language marker for all parts.',
    phase: 'idle',
    legacy: false
  },
  {
    id: 'inventory-6.3-11',
    section: '6.3',
    label: 'Auto-detection of short/ambiguous text → likely English.',
    description: 'Auto-detection of short/ambiguous text → likely English.',
    phase: 'idle',
    legacy: false
  },
  {
    id: 'inventory-6.3-12',
    section: '6.3',
    label: 'Unsupported script/language → English fallback.',
    description: 'Unsupported script/language → English fallback.',
    phase: 'idle',
    legacy: false
  },
  {
    id: 'inventory-6.4-01',
    section: '6.4',
    label: 'No reference and default voice',
    description:
      'No reference and default voice: uses checkpoint built-in conditionals; if absent, “This model needs a voice reference. Choose a preset or upload a clean WAV of at least 6 seconds.”',
    phase: 'idle',
    legacy: false
  },
  {
    id: 'inventory-6.4-02',
    section: '6.4',
    label: 'Reference shorter than 5 s',
    description:
      'Reference shorter than 5 s: “The reference recording is X.Xs; Chatterbox needs at least 5 seconds (6+ recommended).”',
    phase: 'idle',
    legacy: false
  },
  {
    id: 'inventory-6.4-03',
    section: '6.4',
    label: 'Reference exactly 5.0 s',
    description:
      'Reference exactly 5.0 s: narrator accepts it; Turbo/Nano can fail with “Audio prompt must be longer than 5 seconds!”',
    phase: 'idle',
    legacy: false
  },
  {
    id: 'inventory-6.4-04',
    section: '6.4',
    label: 'Empty/unreadable reference',
    description:
      'Empty/unreadable reference: “The reference recording is empty.” or a duration-based error.',
    phase: 'idle',
    legacy: false
  },
  {
    id: 'inventory-6.4-05',
    section: '6.4',
    label: 'Reference file disappeared',
    description:
      'Reference file disappeared: “The uploaded reference recording is no longer available. Please upload it again.”',
    phase: 'idle',
    legacy: false
  },
  {
    id: 'inventory-6.4-06',
    section: '6.4',
    label: 'Selected voice deleted/missing',
    description:
      'Selected voice deleted/missing: “That voice is no longer available. Refresh the voice list and choose another.”',
    phase: 'error',
    legacy: false
  },
  {
    id: 'inventory-6.4-07',
    section: '6.4',
    label: 'Voice reference path missing',
    description: 'Voice reference path missing: “The selected voice reference file is missing.”',
    phase: 'error',
    legacy: false
  },
  {
    id: 'inventory-6.4-08',
    section: '6.4',
    label: 'No reference for save',
    description: 'No reference for save: “Upload or record a reference clip first.”',
    phase: 'idle',
    legacy: false
  },
  {
    id: 'inventory-6.4-09',
    section: '6.4',
    label: 'Delete without confirmation',
    description:
      'Delete without confirmation: “Tick the confirmation box before deleting a custom preset.”',
    phase: 'idle',
    legacy: false
  },
  {
    id: 'inventory-6.4-10',
    section: '6.4',
    label: 'Delete non-custom',
    description: 'Delete non-custom: “Only custom presets saved in this app can be deleted here.”',
    phase: 'idle',
    legacy: false
  },
  {
    id: 'inventory-6.4-11',
    section: '6.4',
    label: 'Delete missing custom',
    description: 'Delete missing custom: “That custom preset was not found.”',
    phase: 'error',
    legacy: false
  },
  {
    id: 'inventory-6.4-12',
    section: '6.4',
    label: 'Custom registry corrupt/missing',
    description:
      'Custom registry corrupt/missing: custom custom_* files are excluded from external discovery, so saved presets can disappear from the list.',
    phase: 'error',
    legacy: false
  },
  {
    id: 'inventory-6.4-13',
    section: '6.4',
    label: 'Uploaded reference override',
    description:
      'Uploaded reference override: persists until cleared; saving a preset does not clear it.',
    phase: 'idle',
    legacy: true
  },
  {
    id: 'inventory-6.4-14',
    section: '6.4',
    label: 'No voice language metadata',
    description: 'No voice language metadata: same voice can be selected for any language.',
    phase: 'idle',
    legacy: false
  },
  {
    id: 'inventory-6.5-01',
    section: '6.5',
    label: 'Queued',
    description:
      'Queued: Gradio queue may wait behind another generation; no queue-position display.',
    phase: 'queued',
    legacy: false
  },
  {
    id: 'inventory-6.5-02',
    section: '6.5',
    label: 'Preparing/loading',
    description: 'Preparing/loading: progress phases as listed in 2.10.',
    phase: 'loading',
    legacy: false
  },
  {
    id: 'inventory-6.5-03',
    section: '6.5',
    label: 'Part progress',
    description:
      'Part progress: “Part X of N · elapsed · about/under 5s left”; initial estimate says “calculating time remaining…”.',
    phase: 'generating',
    legacy: false
  },
  {
    id: 'inventory-6.5-04',
    section: '6.5',
    label: 'Stop requested',
    description: 'Stop requested: “Stopping after the current step…”.',
    phase: 'stopping',
    legacy: false
  },
  {
    id: 'inventory-6.5-05',
    section: '6.5',
    label: 'Stop completed',
    description: 'Stop completed: “Stopped. The unfinished take was discarded.”',
    phase: 'idle',
    legacy: false
  },
  {
    id: 'inventory-6.5-06',
    section: '6.5',
    label: 'Stop with no job',
    description: 'Stop with no job: “No generation is running in this tab.”',
    phase: 'idle',
    legacy: false
  },
  {
    id: 'inventory-6.5-07',
    section: '6.5',
    label: 'Second concurrent request',
    description: 'Second concurrent request: “A generation is already running in this tab.”',
    phase: 'idle',
    legacy: false
  },
  {
    id: 'inventory-6.5-08',
    section: '6.5',
    label: 'Cancellation during model load/download',
    description: 'Cancellation during model load/download: load may finish first.',
    phase: 'downloading',
    legacy: false
  },
  {
    id: 'inventory-6.5-09',
    section: '6.5',
    label: 'Cancellation during decoder',
    description: 'Cancellation during decoder: in-flight step may finish first.',
    phase: 'idle',
    legacy: false
  },
  {
    id: 'inventory-6.5-10',
    section: '6.5',
    label: 'Cancellation during FFmpeg',
    description: 'Cancellation during FFmpeg: export may finish, then output is deleted.',
    phase: 'idle',
    legacy: false
  },
  {
    id: 'inventory-6.5-11',
    section: '6.5',
    label: 'Preview',
    description:
      'Preview: returns “Preview ready — …” or “Could not create preview: …”; no Stop wiring.',
    phase: 'idle',
    legacy: true
  },
  {
    id: 'inventory-6.5-12',
    section: '6.5',
    label: 'No streaming',
    description: 'No streaming: no partial audio download.',
    phase: 'idle',
    legacy: true
  },
  {
    id: 'inventory-6.6-01',
    section: '6.6',
    label: 'FFmpeg missing',
    description:
      'FFmpeg missing: only native-rate 1× WAV works; compressed formats/resampling/speed fail with “ffmpeg is required for this output format or sample rate.”',
    phase: 'error',
    legacy: false
  },
  {
    id: 'inventory-6.6-02',
    section: '6.6',
    label: 'Unsupported format',
    description:
      'Unsupported format: “Unsupported output format: <fmt>” (not reachable through the normal dropdown).',
    phase: 'idle',
    legacy: false
  },
  {
    id: 'inventory-6.6-03',
    section: '6.6',
    label: 'FFmpeg failure',
    description: 'FFmpeg failure: displays FFmpeg stderr or “ffmpeg failed.”',
    phase: 'error',
    legacy: false
  },
  {
    id: 'inventory-6.6-04',
    section: '6.6',
    label: 'Fast-path WAV',
    description: 'Fast-path WAV: no embedded title/artist/comment metadata; sidecar still written.',
    phase: 'idle',
    legacy: false
  },
  {
    id: 'inventory-6.6-05',
    section: '6.6',
    label: 'Short clip + fade',
    description: 'Short clip + fade: fade is skipped if the clip is shorter than two fade lengths.',
    phase: 'idle',
    legacy: false
  },
  {
    id: 'inventory-6.6-06',
    section: '6.6',
    label: 'Silent/very quiet clip',
    description:
      'Silent/very quiet clip: loudness normalization may skip or hit gain limits; trim may return unchanged if all samples are below threshold.',
    phase: 'idle',
    legacy: false
  },
  {
    id: 'inventory-6.6-07',
    section: '6.6',
    label: 'FFmpeg export timeout',
    description: 'FFmpeg export timeout: 1800 seconds; a very large file can fail.',
    phase: 'idle',
    legacy: false
  },
  {
    id: 'inventory-6.6-08',
    section: '6.6',
    label: 'Write failure',
    description: 'Write failure: audio/companions are cleaned up for the failed output.',
    phase: 'error',
    legacy: false
  },
  {
    id: 'inventory-6.6-09',
    section: '6.6',
    label: 'Output file name collision',
    description:
      'Output file name collision: avoided with timestamp + six hex characters, except projects use timestamp only.',
    phase: 'idle',
    legacy: false
  },
  {
    id: 'inventory-6.6-10',
    section: '6.6',
    label: 'No stereo/bit-depth/bitrate controls.',
    description: 'No stereo/bit-depth/bitrate controls.',
    phase: 'idle',
    legacy: false
  },
  {
    id: 'inventory-6.7-01',
    section: '6.7',
    label: 'Approximate timing',
    description: 'Approximate timing: cues are sentence-weighted, not forced-aligned.',
    phase: 'idle',
    legacy: false
  },
  {
    id: 'inventory-6.7-02',
    section: '6.7',
    label: 'Long cue',
    description: 'Long cue: text beyond 4 wrapped lines (~176 characters) is silently truncated.',
    phase: 'idle',
    legacy: true
  },
  {
    id: 'inventory-6.7-03',
    section: '6.7',
    label: 'Cue clamping',
    description:
      'Cue clamping: a cue ending after final audio is clamped; cue duration minimum 0.10 s.',
    phase: 'idle',
    legacy: false
  },
  {
    id: 'inventory-6.7-04',
    section: '6.7',
    label: 'Trimmed start',
    description: 'Trimmed start: cue starts subtract the trim offset divided by speed.',
    phase: 'idle',
    legacy: false
  },
  {
    id: 'inventory-6.7-05',
    section: '6.7',
    label: 'Speed change',
    description: 'Speed change: durations and gaps are divided by speed.',
    phase: 'idle',
    legacy: false
  },
  {
    id: 'inventory-6.7-06',
    section: '6.7',
    label: 'No word-level timing, no translation, no editing, no karaoke-style highlighting.',
    description: 'No word-level timing, no translation, no editing, no karaoke-style highlighting.',
    phase: 'idle',
    legacy: false
  },
  {
    id: 'inventory-6.8-01',
    section: '6.8',
    label: 'No files/pasted text',
    description: 'No files/pasted text: “Upload one or more scripts, or paste a chaptered script.”',
    phase: 'idle',
    legacy: false
  },
  {
    id: 'inventory-6.8-02',
    section: '6.8',
    label: 'No text after split',
    description: 'No text after split: “No text was found to generate.”',
    phase: 'idle',
    legacy: false
  },
  {
    id: 'inventory-6.8-03',
    section: '6.8',
    label: 'Unreadable file',
    description: 'Unreadable file: error includes the filename and aborts the batch setup.',
    phase: 'idle',
    legacy: false
  },
  {
    id: 'inventory-6.8-04',
    section: '6.8',
    label: 'Per-item generation failure',
    description:
      'Per-item generation failure: item is skipped; errors collected; successful items continue.',
    phase: 'error',
    legacy: false
  },
  {
    id: 'inventory-6.8-05',
    section: '6.8',
    label: 'All items fail',
    description: 'All items fail: “No batch items finished. …”',
    phase: 'error',
    legacy: false
  },
  {
    id: 'inventory-6.8-06',
    section: '6.8',
    label: 'Partial success',
    description:
      'Partial success: status reports completed count and first three errors; ZIP contains successes.',
    phase: 'idle',
    legacy: false
  },
  {
    id: 'inventory-6.8-07',
    section: '6.8',
    label: 'Cancel',
    description:
      'Cancel: “Batch stopped after N finished part(s)”; completed files remain on disk but are not returned; no ZIP.',
    phase: 'idle',
    legacy: true
  },
  {
    id: 'inventory-6.8-08',
    section: '6.8',
    label: 'Auto-detect per unit',
    description:
      'Auto-detect per unit: language can differ across units; English-only model + non-English unit can fail that unit.',
    phase: 'idle',
    legacy: false
  },
  {
    id: 'inventory-6.8-09',
    section: '6.8',
    label: 'Same settings/voice',
    description: 'Same settings/voice: no per-chapter overrides.',
    phase: 'idle',
    legacy: false
  },
  {
    id: 'inventory-6.8-10',
    section: '6.8',
    label: '.md chapter stripping',
    description: '.md chapter stripping: headings are removed before splitting.',
    phase: 'idle',
    legacy: false
  },
  {
    id: 'inventory-6.9-01',
    section: '6.9',
    label: 'Empty',
    description: 'Empty: “No saved narrations yet.”',
    phase: 'idle',
    legacy: false
  },
  {
    id: 'inventory-6.9-02',
    section: '6.9',
    label: 'No selection',
    description: 'No selection: “Select a saved narration.”',
    phase: 'idle',
    legacy: false
  },
  {
    id: 'inventory-6.9-03',
    section: '6.9',
    label: 'Missing metadata',
    description:
      'Missing metadata: filename fallback; duration measured; model/language may be blank.',
    phase: 'error',
    legacy: false
  },
  {
    id: 'inventory-6.9-04',
    section: '6.9',
    label: 'External audio',
    description: 'External audio: appears if placed in outputs/.',
    phase: 'idle',
    legacy: false
  },
  {
    id: 'inventory-6.9-05',
    section: '6.9',
    label: 'Delete without confirmation',
    description: 'Delete without confirmation: “Tick the confirmation box first.”',
    phase: 'idle',
    legacy: false
  },
  {
    id: 'inventory-6.9-06',
    section: '6.9',
    label: 'Missing file',
    description: 'Missing file: “That file was not found.”',
    phase: 'error',
    legacy: false
  },
  {
    id: 'inventory-6.9-07',
    section: '6.9',
    label: 'Watermark',
    description:
      'Watermark: detected, not detected (may have been re-encoded/edited), package missing, or check failed.',
    phase: 'idle',
    legacy: false
  },
  {
    id: 'inventory-6.9-08',
    section: '6.9',
    label: 'Open folder failure',
    description: 'Open folder failure: “Could not open the folder: …”',
    phase: 'error',
    legacy: false
  },
  {
    id: 'inventory-6.9-09',
    section: '6.9',
    label: '150-entry cap',
    description: '150-entry cap: older entries are not listed until files are removed.',
    phase: 'idle',
    legacy: false
  },
  {
    id: 'inventory-6.9-10',
    section: '6.9',
    label: 'No search/rename/bulk delete.',
    description: 'No search/rename/bulk delete.',
    phase: 'idle',
    legacy: false
  },
  {
    id: 'inventory-6.10-01',
    section: '6.10',
    label: 'No file',
    description: 'No file: “Choose a Chatterbox project JSON file first.”',
    phase: 'idle',
    legacy: false
  },
  {
    id: 'inventory-6.10-02',
    section: '6.10',
    label: 'Wrong JSON',
    description: 'Wrong JSON: “This is not a Chatterbox Narrator project file.”',
    phase: 'idle',
    legacy: false
  },
  {
    id: 'inventory-6.10-03',
    section: '6.10',
    label: 'Malformed JSON',
    description: 'Malformed JSON: underlying JSON error is shown.',
    phase: 'idle',
    legacy: false
  },
  {
    id: 'inventory-6.10-04',
    section: '6.10',
    label: 'Voice unavailable',
    description: 'Voice unavailable: silently falls back to default.',
    phase: 'error',
    legacy: true
  },
  {
    id: 'inventory-6.10-05',
    section: '6.10',
    label: 'Same-second save',
    description: 'Same-second save: overwrites the previous same-title project.',
    phase: 'idle',
    legacy: true
  },
  {
    id: 'inventory-6.10-06',
    section: '6.10',
    label: 'No project list',
    description: 'No project list: only manual upload.',
    phase: 'idle',
    legacy: false
  },
  {
    id: 'inventory-6.10-07',
    section: '6.10',
    label: 'No audio included.',
    description: 'No audio included.',
    phase: 'idle',
    legacy: false
  },
  {
    id: 'inventory-6.10-08',
    section: '6.10',
    label: 'Dictionary empty on load',
    description: 'Dictionary empty on load: existing dictionary is not cleared.',
    phase: 'idle',
    legacy: false
  },
  {
    id: 'inventory-6.10-09',
    section: '6.10',
    label: 'Version not validated',
    description: 'Version not validated: version is written but not enforced.',
    phase: 'idle',
    legacy: false
  },
  {
    id: 'inventory-6.11-01',
    section: '6.11',
    label: 'Invalid .json settings',
    description: 'Invalid .json settings: defaults/fallbacks; unknown keys ignored.',
    phase: 'idle',
    legacy: false
  },
  {
    id: 'inventory-6.11-02',
    section: '6.11',
    label: 'Invalid sampling values',
    description: 'Invalid sampling values: not semantically clamped; may fail in the sampler.',
    phase: 'idle',
    legacy: true
  },
  {
    id: 'inventory-6.11-03',
    section: '6.11',
    label: 'Current settings vs defaults',
    description:
      'Current settings vs defaults: current settings.json can differ from code defaults; a new UI should distinguish “reset default” from “persisted value.”',
    phase: 'idle',
    legacy: false
  },
  {
    id: 'inventory-6.11-04',
    section: '6.11',
    label: 'LAN/share exposure',
    description: 'LAN/share exposure: no auth, no TLS.',
    phase: 'idle',
    legacy: false
  },
  {
    id: 'inventory-6.11-05',
    section: '6.11',
    label: 'No telemetry, no health endpoint, no job persistence.',
    description: 'No telemetry, no health endpoint, no job persistence.',
    phase: 'idle',
    legacy: false
  },
  {
    id: 'inventory-6.11-06',
    section: '6.11',
    label: 'Linux-only launcher and desktop integration; Windows unsupported by this path.',
    description: 'Linux-only launcher and desktop integration; Windows unsupported by this path.',
    phase: 'idle',
    legacy: false
  }
]
