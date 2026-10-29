import type { BatchWorkspace, SettingsWorkspace, WatermarkResult } from './workspace'

export type ModelId = 'auto' | 'turbo' | 'nano' | 'multilingual' | 'original'
export type EngineId = 'chatterbox'
export type LanguageCode =
  | 'ar'
  | 'da'
  | 'de'
  | 'el'
  | 'en'
  | 'es'
  | 'fi'
  | 'fr'
  | 'he'
  | 'hi'
  | 'it'
  | 'ja'
  | 'ko'
  | 'ms'
  | 'nl'
  | 'no'
  | 'pl'
  | 'pt'
  | 'ru'
  | 'sv'
  | 'sw'
  | 'tr'
  | 'zh'
export type OutputFormat = 'wav' | 'mp3' | 'flac' | 'ogg' | 'm4a'
export type AudioFileFormat = OutputFormat | 'opus' | 'aiff' | 'aif'
export type SamplingKey =
  | 'temperature'
  | 'top_p'
  | 'top_k'
  | 'min_p'
  | 'repetition_penalty'
  | 'exaggeration'
  | 'cfg_weight'
export interface ModelDefinition {
  id: ModelId
  engine: EngineId
  label: string
  description: string
  parameters: string
  repository: string | null
  languages: readonly LanguageCode[]
  sampling: readonly SamplingKey[]
  reactions: boolean
  referenceMinimum: number
  referenceStrict: boolean
  conditioningSeconds: number
  nativeSampleRate: number
  decoderReferenceSeconds: number
  referenceLoudnessLufs: number | null
  cudaPrecision: 'full' | 'half'
  maxSpeechTokens: number
  downloadable: boolean
}
export interface LanguageDefinition {
  code: LanguageCode
  label: string
  nativeLabel: string
  note?: string
}
export interface VoiceDefinition {
  id: string
  label: string
  kind: 'built-in' | 'external' | 'custom'
  description: string
  duration: number | null
  previewAvailable: boolean
  available: boolean
}
export interface GenerationSettings {
  title: string
  language: LanguageCode
  model: ModelId
  auto_detect: boolean
  voice: string
  temperature: number
  top_p: number
  top_k: number
  min_p: number
  repetition_penalty: number
  exaggeration: number
  cfg_weight: number
  chunk_limit: number
  gap: number
  seed: number
  speed: number
  format: OutputFormat
  sample_rate: number
  loudness: boolean
  loudness_target: number
  trim_silence: boolean
  fade_ms: number
  normalize_punct: boolean
  convert_numbers: boolean
  expand_abbrevs: boolean
  strip_markdown: boolean
  remove_emoji: boolean
  pronounce: boolean
}
export type SettingKey = keyof GenerationSettings
export interface NumericSetting {
  key: keyof Pick<
    GenerationSettings,
    SamplingKey | 'chunk_limit' | 'gap' | 'seed' | 'speed' | 'loudness_target' | 'fade_ms'
  >
  label: string
  min: number
  max: number
  step: number
  unit?: string
  description: string
  group: 'sampling' | 'parts' | 'mastering' | 'essential'
}
export type JobPhase =
  | 'idle'
  | 'queued'
  | 'downloading'
  | 'loading'
  | 'preparing'
  | 'generating'
  | 'mastering'
  | 'encoding'
  | 'companions'
  | 'stopping'
  | 'stopped'
  | 'error'
  | 'complete'
export interface JobState {
  id: string
  kind: 'narration' | 'preview' | 'batch' | 'download'
  phase: JobPhase
  progress: number
  title: string
  message: string
  part: number
  total: number
  elapsed: number
  remaining: number | null
  streaming: 'unavailable' | 'buffering' | 'ready'
  paused: boolean
}
export interface ReferenceState {
  status: 'empty' | 'recording' | 'validating' | 'ready' | 'error' | 'missing'
  name: string
  duration: number
  message?: string
}
export interface InstalledModel {
  id: Exclude<ModelId, 'auto'>
  status: 'not-installed' | 'installed' | 'active' | 'downloading' | 'paused' | 'error'
  bytes: number | null
  progress: number
  message?: string
}
export interface PartDetail {
  id: string
  index: number
  text: string
  duration: number
  pause: number
}
export interface OutputRecord {
  id: string
  title: string
  filename: string
  duration: number
  created: string
  format: AudioFileFormat
  sampleRate: number
  language: LanguageCode | null
  model: ModelId | null
  voice: string | null
  seed: number | null
  loudnessGain: number | null
  requestedModel: ModelId | null
  sourceCharacters: number | null
  speed: number | null
  trimStart: number | null
  settingsSnapshot: GenerationSettings | null
  metadataAvailable: boolean
  external: boolean
  companions: readonly ('srt' | 'vtt' | 'txt' | 'json')[]
  parts: PartDetail[]
}
export interface BatchUnit {
  id: string
  title: string
  language: LanguageCode
  status: 'pending' | 'generating' | 'complete' | 'error' | 'skipped'
  message?: string
  outputId?: string
}
export interface ScriptInspection {
  status: 'ready' | 'loading' | 'error'
  preparedText: string
  parts: PartDetail[]
  notes: string[]
  error: string | null
}
export interface PreviewResult {
  id: string
  language: LanguageCode
  duration: number
  text: string
}
export interface StudioSnapshot {
  revision: number
  settings: GenerationSettings
  script: string
  documentRevision: number
  inspection: ScriptInspection | null
  preview: PreviewResult | null
  dictionary: string
  reference: ReferenceState
  job: JobState
  voices: VoiceDefinition[]
  models: InstalledModel[]
  outputs: OutputRecord[]
  units: BatchUnit[]
  batch: BatchWorkspace
  configuration: SettingsWorkspace
  watermark: WatermarkResult | null
  statusIsError: boolean
  device: { mode: 'auto' | 'cpu' | 'cuda'; label: string; vram: string | null; available: boolean }
  dependencies: { ffmpeg: boolean; perth: boolean; online: boolean }
  status: string | null
  playback: { playing: boolean; position: number; outputId: string | null }
  selectedOutput: string | null
}
export type StudioCommand =
  | { type: 'settings.update'; settings: GenerationSettings }
  | { type: 'script.update'; text: string }
  | { type: 'script.inspect' }
  | { type: 'status.dismiss' }
  | { type: 'dictionary.save'; text: string }
  | { type: 'job.start'; kind: 'narration' | 'preview' | 'batch' }
  | { type: 'job.cancel' }
  | { type: 'batch.source'; source: 'files' | 'text' }
  | { type: 'batch.text'; text: string }
  | { type: 'batch.split'; enabled: boolean }
  | { type: 'batch.import' | 'batch.prepare' | 'batch.start' }
  | { type: 'batch.remove-file'; id: string }
  | { type: 'device.set'; mode: 'auto' | 'cpu' | 'cuda' }
  | {
      type:
        | 'preferences.save'
        | 'storage.choose'
        | 'storage.open'
        | 'previews.clear'
        | 'diagnostics.refresh'
        | 'diagnostics.copy'
        | 'logs.open'
        | 'credentials.remove'
    }
  | { type: 'credentials.set'; token: string }
  | { type: 'reference.attach'; source: 'upload' | 'record' }
  | { type: 'reference.clear' }
  | { type: 'voice.save'; label: string }
  | { type: 'voice.delete'; id: string; confirmed: boolean }
  | { type: 'voices.refresh' }
  | { type: 'model.pause'; id: Exclude<ModelId, 'auto'>; paused: boolean }
  | { type: 'model.download'; id: Exclude<ModelId, 'auto'> }
  | { type: 'model.remove'; id: Exclude<ModelId, 'auto'>; confirmed: boolean }
  | { type: 'output.select'; id: string }
  | { type: 'output.delete'; id: string; confirmed: boolean }
  | { type: 'output.export'; id: string; format: 'audio' | 'srt' | 'vtt' | 'txt' | 'json' | 'zip' }
  | { type: 'output.watermark'; id: string }
  | { type: 'outputs.refresh' }
  | { type: 'folder.open' }
  | { type: 'project.save' | 'project.open' | 'script.import' | 'settings.restore' }
  | { type: 'playback.toggle'; id: string }
  | { type: 'playback.seek'; seconds: number; id?: string }
export interface StudioAPI {
  getSnapshot: () => Promise<StudioSnapshot>
  dispatch: (command: StudioCommand) => Promise<StudioSnapshot>
  onChange: (callback: (snapshot: StudioSnapshot) => void) => () => void
}
