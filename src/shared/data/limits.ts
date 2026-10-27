export const inventoryLimits = [
  {
    label: 'Whole-script text length',
    value: 'no hard limit',
    consequence: 'Long scripts are chunked; no UI warning.'
  },
  {
    label: 'Chunk size',
    value: '60–500 chars',
    consequence: 'Controls part length; model still caps tokens.'
  },
  {
    label: 'Model speech per part',
    value: '1000 tokens (~40 s at 25 tokens/s)',
    consequence: 'Long parts, especially CJK at 500 chars, can be cut at the model cap.'
  },
  {
    label: 'Reference minimum',
    value: '5.0 s',
    consequence: '6+ recommended; exactly 5.0 s can fail Turbo/Nano.'
  },
  {
    label: 'Reference save maximum',
    value: '40 s',
    consequence: 'Longer files are truncated on preset save.'
  },
  {
    label: 'Decoder reference use',
    value: 'first 10 s',
    consequence: 'Voice conditioning ignores later audio.'
  },
  {
    label: 'Speech-token reference use',
    value: '6 s Original/Multilingual; 15 s Turbo/Nano',
    consequence: 'Later reference audio does not affect those encoders.'
  },
  {
    label: 'History entries',
    value: '150',
    consequence: 'Older files hidden.'
  },
  {
    label: 'Part preview rows',
    value: '400',
    consequence: 'Longer tables are truncated.'
  },
  {
    label: 'Subtitle text',
    value: '44 chars/line, 4 lines',
    consequence: 'Long cue text is truncated.'
  },
  {
    label: 'Title',
    value: '120 chars in settings; 60 in filename',
    consequence: 'Longer titles are shortened for filenames.'
  },
  {
    label: 'Project filename title',
    value: '50 chars',
    consequence: 'Project names are shortened.'
  },
  {
    label: 'Voice label',
    value: '60 chars',
    consequence: 'Longer labels shortened.'
  },
  {
    label: 'Metadata comment',
    value: '400 chars',
    consequence: 'Model/language/voice comment truncated.'
  },
  {
    label: 'FFmpeg export timeout',
    value: '1800 s',
    consequence: 'Very large exports can fail.'
  },
  {
    label: 'CPU threads',
    value: 'min(6, CPU count)',
    consequence: 'Fixed.'
  },
  {
    label: 'Concurrent jobs',
    value: '1 globally',
    consequence: 'Queue/lock waits.'
  },
  {
    label: 'Loaded models',
    value: '1',
    consequence: 'Switching unloads previous.'
  },
  {
    label: 'Preview cleanup',
    value: 'none',
    consequence: 'Preview WAV/JSON files accumulate.'
  },
  {
    label: 'Batch count',
    value: 'no explicit limit',
    consequence: 'Memory/disk/queue dependent.'
  }
] as const
