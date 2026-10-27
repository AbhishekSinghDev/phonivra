import type { FixtureDefinition, JobState, OutputRecord, StudioSnapshot } from '../studio'
import { defaultSettings, models, voices } from './catalog'
import { inventoryLimits } from './limits'
import { inventoryFixtures, inventoryMessages } from './inventory-fixtures'

export const sampleScript =
  'Some stories begin with a question. Others begin with a sound.\n\nClose your eyes for a moment. [pause=1.5] Imagine a place you have never been, but somehow remember.\n\nThis is where our journey begins.'
export const idleJob: JobState = {
  id: 'demo-job',
  kind: 'narration',
  phase: 'idle',
  progress: 0,
  title: 'A place to begin',
  message: 'Ready when you are.',
  part: 0,
  total: 8,
  elapsed: 0,
  remaining: null,
  streaming: 'unavailable',
  paused: true
}
export const sampleOutput: OutputRecord = {
  id: 'take-1',
  title: 'A place to begin',
  filename: 'a-place-to-begin-20261027-102400-a31e9c.wav',
  duration: 83.4,
  created: '2026-10-27T04:54:00Z',
  format: 'wav',
  sampleRate: 24000,
  language: 'en',
  model: 'turbo',
  voice: 'Original narrator',
  seed: 482901,
  loudnessGain: 2.1,
  requestedModel: 'auto',
  sourceCharacters: sampleScript.length,
  speed: 1,
  trimStart: 0.05,
  settingsSnapshot: { ...defaultSettings, title: 'A place to begin' },
  metadataAvailable: true,
  external: false,
  companions: ['srt', 'vtt', 'txt', 'json'],
  parts: Array.from({ length: 8 }, (_, i) => ({
    id: `part-${i + 1}`,
    index: i + 1,
    text: [
      'Some stories begin with a question.',
      'Others begin with a sound.',
      'Close your eyes for a moment.',
      'Imagine a place you have never been, but somehow remember.'
    ][i % 4],
    duration: 8.4 + i * 0.6,
    pause: i === 2 ? 1.5 : 0
  }))
}
export const curatedFixtures: readonly FixtureDefinition[] = [
  {
    id: 'batch-empty',
    section: '6.8',
    label: 'Batch with no inputs',
    description: 'Upload one or more scripts, or paste a chaptered script.',
    phase: 'idle'
  },
  {
    id: 'batch-generating',
    section: '6.8',
    label: 'Batch generating',
    description: 'Item 2 of 3 · completed files remain available.',
    phase: 'generating'
  },
  {
    id: 'batch-stopped',
    section: '6.8',
    label: 'Batch stopped with completed files',
    description: 'Batch stopped after 2 finished part(s).',
    phase: 'stopped',
    backendWork: true
  },
  {
    id: 'batch-all-failed',
    section: '6.8',
    label: 'All batch items failed',
    description: 'No batch items finished. The selected model does not support these languages.',
    phase: 'error'
  },
  {
    id: 'batch-unreadable',
    section: '6.8',
    label: 'Unreadable batch file',
    description: 'Could not read damaged-script.md: the file is unreadable.',
    phase: 'idle'
  },
  {
    id: 'download-paused',
    section: '6.1',
    label: 'Model download paused',
    description: 'Download paused. Partial files are retained.',
    phase: 'downloading',
    backendWork: true
  },
  {
    id: 'download-error',
    section: '6.1',
    label: 'Model download failed',
    description: 'Model download could not finish. Check your connection and retry.',
    phase: 'error',
    backendWork: true
  },
  {
    id: 'voices-empty',
    section: '6.4',
    label: 'No voices available',
    description: 'Refresh the voice list or attach a recording.',
    phase: 'idle'
  },
  {
    id: 'watermark-not-detected',
    section: '6.9',
    label: 'Watermark not detected',
    description:
      'Watermark not detected: 0.24. The file may have been re-encoded or edited heavily.',
    phase: 'idle'
  },
  {
    id: 'watermark-unavailable',
    section: '6.9',
    label: 'Perth detector unavailable',
    description: 'Watermark check needs the Perth package: unavailable in this scenario.',
    phase: 'idle'
  },
  {
    id: 'gpu-unavailable',
    section: '6.1',
    label: 'Requested NVIDIA GPU unavailable',
    description:
      'NVIDIA GPU is not available. Reboot after installing the driver, or run with CHATTERBOX_DEVICE=cpu.',
    phase: 'error'
  },
  {
    id: 'settings-invalid',
    section: '6.11',
    label: 'Invalid saved configuration',
    description:
      'Saved settings could not be read. Factory defaults were restored; unknown settings are ignored.',
    phase: 'idle'
  },

  {
    id: 'ready',
    section: 'Overview',
    label: 'Ready to narrate',
    description: 'A script and installed model, ready to generate.',
    phase: 'idle'
  },
  {
    id: 'first-launch',
    section: '6.1',
    label: 'First launch',
    description: 'No model installed. Device and library are ready.',
    phase: 'idle'
  },
  {
    id: 'loading',
    section: '6.1',
    label: 'Loading a model',
    description: 'Loading Chatterbox Turbo — time estimate starts after loading.',
    phase: 'loading'
  },
  {
    id: 'downloading',
    section: '6.1',
    label: 'Downloading a model',
    description: 'Downloading Chatterbox Turbo. Download sizes are mock values.',
    phase: 'downloading',
    backendWork: true
  },
  {
    id: 'generating',
    section: '6.5',
    label: 'Generating with progress',
    description: 'Part 3 of 8 · calculating time remaining…',
    phase: 'generating'
  },
  {
    id: 'streaming',
    section: '6.5',
    label: 'Streaming preview',
    description: 'Provisional audio is ready. Final audio still needs mastering.',
    phase: 'generating',
    backendWork: true
  },
  {
    id: 'cancelling',
    section: '6.5',
    label: 'Cancellation requested',
    description: 'Stopping after the current step…',
    phase: 'stopping'
  },
  {
    id: 'stopped',
    section: '6.5',
    label: 'Narration stopped',
    description: 'Stopped. The unfinished take was discarded.',
    phase: 'stopped'
  },
  {
    id: 'complete',
    section: '6.6',
    label: 'Completed narration',
    description: 'Narration ready. Audio and companion files are available.',
    phase: 'complete'
  },
  {
    id: 'empty',
    section: '6.9',
    label: 'Empty library',
    description: 'No saved narrations yet.',
    phase: 'idle'
  },
  {
    id: 'error',
    section: '6.1',
    label: 'GPU memory error',
    description:
      'The GPU ran out of memory while loading this model. Try Chatterbox Nano, a shorter script, or CPU mode.',
    phase: 'error'
  },
  {
    id: 'partial',
    section: '6.8',
    label: 'Batch partial success',
    description: '2 of 3 items finished. One item needs attention.',
    phase: 'complete'
  },
  {
    id: 'unsupported',
    section: '6.3',
    label: 'Unsupported model and language',
    description: 'Chatterbox Turbo is English-only. Choose Multilingual V3 or Auto for Hindi.',
    phase: 'error'
  },
  {
    id: 'reference-empty',
    section: '6.4',
    label: 'No voice reference',
    description: 'Choose a preset, or attach a reference recording.',
    phase: 'idle',
    reference: 'empty'
  },
  {
    id: 'reference-recording',
    section: '6.4',
    label: 'Recording a reference',
    description: 'Recording reference. Microphone access is simulated.',
    phase: 'idle',
    reference: 'recording',
    backendWork: true
  },
  {
    id: 'reference-validating',
    section: '6.4',
    label: 'Validating a reference',
    description: 'Checking reference duration and audio.',
    phase: 'idle',
    reference: 'validating'
  },
  {
    id: 'reference-ready',
    section: '6.4',
    label: 'Reference overrides preset',
    description: 'Attached recording overrides Original narrator until cleared.',
    phase: 'idle',
    reference: 'ready'
  },
  {
    id: 'reference-short',
    section: '6.4',
    label: 'Reference too short',
    description:
      'The reference recording is 3.2s; Chatterbox needs at least 5 seconds (6+ recommended).',
    phase: 'idle',
    reference: 'error'
  },
  {
    id: 'reference-missing',
    section: '6.4',
    label: 'Reference file missing',
    description: 'The uploaded reference recording is no longer available. Please upload it again.',
    phase: 'idle',
    reference: 'missing'
  },
  {
    id: 'metadata-missing',
    section: '6.9',
    label: 'External audio without metadata',
    description: 'Filename and measured duration remain available.',
    phase: 'complete'
  },
  {
    id: 'ffmpeg-missing',
    section: '6.6',
    label: 'FFmpeg unavailable',
    description: 'ffmpeg is required for this output format or sample rate.',
    phase: 'error'
  },
  {
    id: 'offline',
    section: '6.1',
    label: 'Offline with installed models',
    description: 'Installed models remain available. Downloads require a connection.',
    phase: 'idle'
  },
  {
    id: 'large-list',
    section: '6.12',
    label: 'Long lists and part timings',
    description: '500 mock outputs and 500 parts demonstrate windowed rendering.',
    phase: 'complete'
  }
]
export const fixtures: readonly FixtureDefinition[] = [
  ...curatedFixtures,
  ...inventoryFixtures,
  ...inventoryLimits.map((limit, index): FixtureDefinition => ({
    id: `inventory-6.12-${index + 1}`,
    section: '6.12',
    label: limit.label,
    description: `${limit.value}: ${limit.consequence}`,
    phase: 'idle',
    legacy: true
  })),
  ...inventoryMessages.map((item): FixtureDefinition => ({
    id: item.id,
    section: item.section,
    label: item.message,
    description: item.message,
    phase: /Stopping/.test(item.message)
      ? 'stopping'
      : /Stopped|stopped/.test(item.message)
        ? 'stopped'
        : 'error'
  }))
]
export function makeSnapshot(id = 'ready'): StudioSnapshot {
  const fixture = fixtures.find((item) => item.id === id) ?? curatedFixtures[0]
  const output = structuredClone(sampleOutput)
  const state: StudioSnapshot = {
    revision: 0,
    batch: { source: 'files', files: [], text: '', splitChapters: true, reviewed: false },
    configuration: {
      saved: { ...defaultSettings, title: 'A place to begin' },
      preferences: {
        cachePath: 'Application data / models / huggingface',
        tokenConfigured: false,
        previewBytes: 18200000,
        logs: [
          'Application started. Local mock services ready.',
          'Device selected: CPU.',
          'FFmpeg and Perth available.',
          'No remote reporting is enabled.'
        ]
      }
    },
    watermark: null,
    statusIsError: fixture.phase === 'error',
    scenario: fixture.id,
    settings: { ...defaultSettings, title: 'A place to begin' },
    script: sampleScript,
    documentRevision: 0,
    inspection: null,
    preview: null,
    dictionary: '# One pronunciation per line\nPhonivra => fo-nee-vra',
    reference: {
      status: fixture.reference ?? 'empty',
      name: 'Studio reference.wav',
      duration: fixture.id === 'reference-short' ? 3.2 : 18.4,
      message:
        fixture.reference === 'error' || fixture.reference === 'missing'
          ? fixture.description
          : undefined
    },
    job: {
      ...idleJob,
      phase: fixture.phase,
      message: fixture.description,
      progress:
        fixture.phase === 'complete'
          ? 100
          : fixture.phase === 'generating'
            ? 38
            : fixture.phase === 'downloading'
              ? 42
              : fixture.phase === 'stopping'
                ? 38
                : 0,
      part: fixture.phase === 'generating' ? 3 : 0,
      elapsed: fixture.phase === 'generating' ? 24 : 0,
      streaming: fixture.id === 'streaming' ? 'ready' : 'unavailable'
    },
    voices: structuredClone([...voices]),
    models: models
      .filter((m) => m.downloadable)
      .map((m, i) => ({
        id: m.id as 'turbo' | 'nano' | 'multilingual' | 'original',
        status: i === 0 ? 'active' : i === 1 ? 'installed' : 'not-installed',
        bytes: i < 2 ? 820000000 : null,
        progress: i < 2 ? 100 : 0
      })),
    outputs: fixture.id === 'empty' || fixture.id === 'first-launch' ? [] : [output],
    units: [
      {
        id: 'unit-1',
        title: 'Introduction',
        language: 'en',
        status: 'complete',
        outputId: output.id
      },
      {
        id: 'unit-2',
        title: 'The first crossing',
        language: 'en',
        status: 'complete',
        outputId: output.id
      },
      {
        id: 'unit-3',
        title: 'A different shore',
        language: 'hi',
        status: fixture.id === 'partial' ? 'error' : 'pending',
        message:
          fixture.id === 'partial'
            ? 'Chatterbox Turbo is English-only. Choose Multilingual V3 or Auto for Hindi.'
            : undefined
      }
    ],
    device: { mode: 'auto', label: 'CPU', vram: null, available: true },
    dependencies: {
      ffmpeg: fixture.id !== 'ffmpeg-missing',
      perth: true,
      online: fixture.id !== 'offline'
    },
    status: null,
    playback: { playing: false, position: 0, outputId: null },
    selectedOutput: fixture.id === 'empty' || fixture.id === 'first-launch' ? null : output.id
  }
  if (fixture.id === 'first-launch')
    state.models.forEach((m) => {
      m.status = 'not-installed'
      m.bytes = null
      m.progress = 0
    })
  if (fixture.id === 'unsupported') {
    state.settings.language = 'hi'
    state.settings.model = 'turbo'
  }
  if (fixture.id === 'downloading') {
    state.job.kind = 'download'
    state.models[0].status = 'downloading'
    state.models[0].progress = 42
  }
  if (fixture.id === 'partial') state.job.kind = 'batch'
  if (fixture.id === 'metadata-missing') {
    output.metadataAvailable = false
    output.external = true
    output.title = output.filename
    output.model = null
    output.language = null
    output.voice = null
    output.seed = null
    output.loudnessGain = null
    output.companions = []
    output.parts = []
  }
  if (fixture.id === 'large-list') {
    state.outputs = Array.from({ length: 500 }, (_, index) => ({
      ...output,
      id: `take-${index + 1}`,
      title: `Chapter ${index + 1}: A place to begin`
    }))
    state.outputs[0].parts = Array.from({ length: 500 }, (_, index) => ({
      ...output.parts[index % output.parts.length],
      id: `part-${index + 1}`,
      index: index + 1
    }))
  }
  // Inventory-derived review fixtures also materialize the relevant affected slices.
  if (fixture.id.startsWith('inventory-')) {
    const label = fixture.label.toLowerCase()
    const text = fixture.description
    state.status = text
    if (fixture.section === '6.1') {
      if (label.includes('cuda') || label.includes('oom')) {
        state.device = {
          mode: 'cuda',
          label: 'NVIDIA GPU',
          vram: '8 GB total (mock)',
          available: !label.includes('unavailable')
        }
      }
      if (label.includes('first launch')) {
        state.outputs = []
        state.selectedOutput = null
        state.models.forEach((model) => {
          model.status = 'not-installed'
          model.bytes = null
          model.progress = 0
        })
      }
    }
    if (fixture.section === '6.2') {
      if (label.includes('empty')) state.script = ''
      if (label.includes('whitespace')) state.script = '   [pause]   '
      if (label.includes('cjk')) {
        state.script = '旅はここから始まります。まだ見ぬ場所へ向かいましょう。'
        state.settings.language = 'ja'
      }
      if (label.includes('gap=0')) state.settings.gap = 0
    }
    if (fixture.section === '6.3') {
      if (label.includes('explicit') || label.includes('auto-detect on')) {
        state.settings.model = 'turbo'
        state.settings.language = 'hi'
      }
      if (label.includes('top_k')) state.settings.model = 'multilingual'
      if (label.includes('min_p')) state.settings.model = 'turbo'
      if (label.includes('numbers')) {
        state.settings.language = 'fr'
        state.settings.convert_numbers = true
      }
    }
    if (fixture.section === '6.4') {
      if (label.includes('shorter'))
        state.reference = {
          status: 'error',
          name: 'Short reference.wav',
          duration: 3.2,
          message:
            'The reference recording is 3.2s; Chatterbox needs at least 5 seconds (6+ recommended).'
        }
      if (label.includes('exactly'))
        state.reference = { status: 'ready', name: 'Boundary reference.wav', duration: 5 }
      if (label.includes('empty/unreadable'))
        state.reference = {
          status: 'error',
          name: 'Empty reference.wav',
          duration: 0,
          message: 'The reference recording is empty.'
        }
      if (label.includes('disappeared') || label.includes('path missing'))
        state.reference = {
          status: 'missing',
          name: 'Missing reference.wav',
          duration: 12,
          message:
            'The uploaded reference recording is no longer available. Please upload it again.'
        }
      if (label.includes('override'))
        state.reference = { status: 'ready', name: 'Attached reference.wav', duration: 18.4 }
      if (label.includes('voice deleted')) state.voices[0].available = false
      if (label.includes('registry'))
        state.voices = state.voices.filter((voice) => voice.kind !== 'custom')
    }
    if (fixture.section === '6.6' && label.includes('ffmpeg missing')) {
      state.dependencies.ffmpeg = false
      state.settings.format = 'mp3'
    }
    if (fixture.section === '6.8') {
      if (label.includes('no files') || label.includes('no text')) {
        state.units = []
        state.script = ''
      }
      if (label.includes('all items'))
        state.units.forEach((unit) => {
          unit.status = 'error'
          unit.message = 'Could not generate audio: simulated batch item failure.'
          delete unit.outputId
        })
      if (label.includes('partial') || label.includes('per-item')) {
        state.job.kind = 'batch'
        state.units[2].status = 'error'
        state.units[2].message = 'Could not generate audio: simulated item failure.'
      }
      if (label === 'cancel') {
        state.job.kind = 'batch'
        state.job.phase = 'stopped'
        state.job.message = 'Batch stopped after 2 finished part(s).'
      }
    }
    if (fixture.section === '6.9') {
      if (label === 'empty') {
        state.outputs = []
        state.selectedOutput = null
      }
      if (label.includes('no selection')) state.selectedOutput = null
      if (label.includes('missing metadata') || label.includes('external audio')) {
        output.metadataAvailable = false
        output.external = true
        output.model = null
        output.language = null
        output.companions = []
        output.parts = []
      }
      if (label.includes('watermark')) state.dependencies.perth = false
      if (label.includes('150-entry'))
        state.outputs = Array.from({ length: 150 }, (_, index) => ({
          ...output,
          id: `take-${index + 1}`,
          title: `Narration ${index + 1}`
        }))
    }
    if (fixture.section === '6.10' && label.includes('dictionary empty')) state.dictionary = ''
    if (fixture.section === '6.11' && label.includes('invalid'))
      state.settings = { ...defaultSettings }
  }
  const batchFixture = fixture.section === '6.8' || fixture.id === 'partial'
  if (!batchFixture) state.units = []
  if (batchFixture && state.units.length) {
    state.batch.text =
      '# The first crossing\nAn example chapter.\n\n# A different shore\nAnother example chapter.'
    state.batch.source = 'text'
    state.batch.reviewed = true
    state.job.kind = 'batch'
    state.job.total = state.units.length
    const second = structuredClone(sampleOutput)
    second.id = 'take-2'
    second.title = 'The first crossing'
    if (!state.outputs.some((item) => item.id === second.id)) state.outputs.push(second)
    if (state.units[1].status === 'complete') state.units[1].outputId = second.id
  }
  if (fixture.id === 'batch-empty') {
    state.units = []
    state.batch.reviewed = false
    state.batch.text = ''
  }
  if (fixture.id === 'batch-generating') {
    state.job.kind = 'batch'
    state.job.part = 2
    state.units[1].status = 'generating'
    delete state.units[1].outputId
    state.units[2].status = 'pending'
  }
  if (fixture.id === 'batch-stopped') {
    state.job.kind = 'batch'
    state.units[2].status = 'pending'
  }
  if (fixture.id === 'batch-all-failed')
    state.units.forEach((unit) => {
      unit.status = 'error'
      unit.message = 'Chatterbox Turbo is English-only. Choose Multilingual V3 or Auto for Hindi.'
      delete unit.outputId
    })
  if (fixture.id === 'batch-unreadable') {
    state.units = []
    state.batch.source = 'files'
    state.batch.reviewed = false
    state.batch.files = [
      { id: 'unreadable-file', name: 'damaged-script.md', characters: 0, readable: false }
    ]
  }
  if (fixture.id === 'download-paused') {
    state.job.kind = 'download'
    state.job.paused = true
    state.job.progress = 42
    state.models[0].status = 'paused'
    state.models[0].progress = 42
  }
  if (fixture.id === 'download-error') {
    state.job.kind = 'download'
    state.models[0].status = 'error'
    state.models[0].message = fixture.description
    state.models[0].bytes = null
  }
  if (fixture.id === 'voices-empty') state.voices = []
  if (fixture.id === 'watermark-not-detected')
    state.watermark = {
      outputId: sampleOutput.id,
      state: 'not-detected',
      score: 0.24,
      message: fixture.description
    }
  if (fixture.id === 'watermark-unavailable') {
    state.dependencies.perth = false
    state.watermark = {
      outputId: sampleOutput.id,
      state: 'unavailable',
      score: null,
      message: fixture.description
    }
  }
  if (fixture.id === 'gpu-unavailable') {
    state.device.mode = 'cuda'
    state.device.available = false
  }
  if (fixture.id === 'settings-invalid') {
    state.settings = { ...defaultSettings }
    state.configuration.saved = { ...defaultSettings }
    state.status = fixture.description
  }
  return state
}
