import type { JobState, OutputRecord, StudioSnapshot } from '../studio'
import { defaultSettings, models, voices } from './catalog'

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
export function makeSnapshot(): StudioSnapshot {
  const output = structuredClone(sampleOutput)
  return {
    revision: 0,
    batch: { source: 'files', files: [], text: '', splitChapters: true, reviewed: false },
    configuration: {
      saved: { ...defaultSettings, title: '' },
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
    statusIsError: false,
    settings: { ...defaultSettings, title: '' },
    script: '',
    documentRevision: 0,
    inspection: null,
    preview: null,
    dictionary: '',
    reference: { status: 'empty', name: 'Studio reference.wav', duration: 18.4 },
    job: { ...idleJob, message: 'Ready when you are.' },
    voices: structuredClone([...voices]),
    models: models
      .filter((m) => m.downloadable)
      .map((m, i) => ({
        id: m.id as 'turbo' | 'nano' | 'multilingual' | 'original',
        status: i === 0 ? 'active' : i === 1 ? 'installed' : 'not-installed',
        bytes: i < 2 ? 820000000 : null,
        progress: i < 2 ? 100 : 0
      })),
    outputs: [output],
    units: [],
    device: { mode: 'auto', label: 'CPU', vram: null, available: true },
    dependencies: { ffmpeg: true, perth: true, online: true },
    status: null,
    playback: { playing: false, position: 0, outputId: null },
    selectedOutput: output.id
  }
}
