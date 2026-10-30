import { languages, models, numericSettings } from './data/catalog'
import type { GenerationSettings, StudioCommand } from './studio'

const booleanKeys = [
  'auto_detect',
  'loudness',
  'trim_silence',
  'normalize_punct',
  'convert_numbers',
  'expand_abbrevs',
  'strip_markdown',
  'remove_emoji',
  'pronounce'
] as const
export function validateSettings(raw: unknown): raw is GenerationSettings {
  if (!raw || typeof raw !== 'object') return false
  const s = raw as GenerationSettings
  return (
    typeof s.title === 'string' &&
    s.title.length <= 120 &&
    typeof s.voice === 'string' &&
    s.voice.length <= 256 &&
    languages.some((l) => l.code === s.language) &&
    models.some((m) => m.id === s.model) &&
    ['wav', 'mp3', 'flac', 'ogg', 'm4a'].includes(s.format) &&
    [24000, 44100, 48000].includes(s.sample_rate) &&
    booleanKeys.every((key) => typeof s[key] === 'boolean') &&
    numericSettings.every(
      (field) =>
        Number.isFinite(s[field.key]) &&
        s[field.key] >= field.min &&
        s[field.key] <= field.max &&
        (field.step >= 1 ? Number.isInteger(s[field.key]) : true)
    )
  )
}
export function validateCommand(raw: unknown): raw is StudioCommand {
  if (!raw || typeof raw !== 'object' || !('type' in raw)) return false
  const c = raw as StudioCommand
  const hasId = (value: unknown): value is string =>
    typeof value === 'string' && value.length > 0 && value.length <= 256
  switch (c.type) {
    case 'settings.update':
      return validateSettings(c.settings)
    case 'batch.text':
    case 'script.update':
    case 'dictionary.save':
      return typeof c.text === 'string'
    case 'job.start':
      return ['narration', 'preview', 'batch'].includes(c.kind)
    case 'reference.attach':
      return c.source === 'upload' || c.source === 'record'
    case 'voice.save':
      return typeof c.label === 'string' && c.label.length <= 60
    case 'voice.delete':
    case 'output.delete':
      return hasId(c.id) && typeof c.confirmed === 'boolean'
    case 'model.pause':
      return (
        models.some((model) => model.id === c.id && model.downloadable) &&
        typeof c.paused === 'boolean'
      )
    case 'batch.source':
      return c.source === 'files' || c.source === 'text'
    case 'batch.split':
      return typeof c.enabled === 'boolean'
    case 'batch.remove-file':
      return hasId(c.id)
    case 'device.set':
      return ['auto', 'cpu', 'cuda'].includes(c.mode)
    case 'credentials.set':
      return typeof c.token === 'string' && c.token.length > 0 && c.token.length <= 4096
    case 'model.remove':
      return models.some((m) => m.id === c.id && m.downloadable) && typeof c.confirmed === 'boolean'
    case 'model.download':
      return models.some((m) => m.id === c.id && m.downloadable)
    case 'output.select':
    case 'output.watermark':
    case 'playback.toggle':
      return hasId(c.id)
    case 'output.export':
      return hasId(c.id) && ['audio', 'srt', 'vtt', 'txt', 'json', 'zip'].includes(c.format)
    case 'playback.seek':
      return Number.isFinite(c.seconds) && c.seconds >= 0 && (c.id === undefined || hasId(c.id))
    case 'batch.import':
    case 'batch.prepare':
    case 'batch.start':
    case 'preferences.save':
    case 'storage.choose':
    case 'storage.open':
    case 'previews.clear':
    case 'diagnostics.refresh':
    case 'diagnostics.copy':
    case 'logs.open':
    case 'credentials.remove':
    case 'script.inspect':
    case 'status.dismiss':
    case 'job.cancel':
    case 'reference.clear':
    case 'voices.refresh':
    case 'outputs.refresh':
    case 'folder.open':
    case 'project.save':
    case 'project.open':
    case 'script.import':
    case 'settings.restore':
      return true
    default:
      return false
  }
}
