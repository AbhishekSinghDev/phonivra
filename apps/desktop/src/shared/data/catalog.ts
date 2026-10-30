import type {
  GenerationSettings,
  LanguageDefinition,
  ModelDefinition,
  NumericSetting,
  VoiceDefinition
} from '../studio'

export const languages: readonly LanguageDefinition[] = [
  { code: 'ar', label: 'Arabic', nativeLabel: 'العربية' },
  {
    code: 'da',
    label: 'Danish',
    nativeLabel: 'Dansk',
    note: 'Detection may confuse Danish, Norwegian and Swedish.'
  },
  { code: 'de', label: 'German', nativeLabel: 'Deutsch' },
  { code: 'el', label: 'Greek', nativeLabel: 'Ελληνικά' },
  { code: 'en', label: 'English', nativeLabel: 'English' },
  { code: 'es', label: 'Spanish', nativeLabel: 'Español' },
  { code: 'fi', label: 'Finnish', nativeLabel: 'Suomi' },
  { code: 'fr', label: 'French', nativeLabel: 'Français' },
  {
    code: 'he',
    label: 'Hebrew',
    nativeLabel: 'עברית',
    note: 'Optional diacritics processor is not bundled.'
  },
  {
    code: 'hi',
    label: 'Hindi',
    nativeLabel: 'हिन्दी',
    note: 'Number conversion supported; ordinal handling needs a product decision.'
  },
  { code: 'it', label: 'Italian', nativeLabel: 'Italiano' },
  {
    code: 'ja',
    label: 'Japanese',
    nativeLabel: '日本語',
    note: 'CJK part boundaries need backend improvements.'
  },
  { code: 'ko', label: 'Korean', nativeLabel: '한국어' },
  { code: 'ms', label: 'Malay', nativeLabel: 'Bahasa Melayu' },
  { code: 'nl', label: 'Dutch', nativeLabel: 'Nederlands' },
  {
    code: 'no',
    label: 'Norwegian',
    nativeLabel: 'Norsk',
    note: 'Detection may confuse Danish, Norwegian and Swedish.'
  },
  { code: 'pl', label: 'Polish', nativeLabel: 'Polski' },
  { code: 'pt', label: 'Portuguese', nativeLabel: 'Português' },
  {
    code: 'ru',
    label: 'Russian',
    nativeLabel: 'Русский',
    note: 'Optional stress processor is not bundled.'
  },
  {
    code: 'sv',
    label: 'Swedish',
    nativeLabel: 'Svenska',
    note: 'Detection may confuse Danish, Norwegian and Swedish.'
  },
  { code: 'sw', label: 'Swahili', nativeLabel: 'Kiswahili' },
  { code: 'tr', label: 'Turkish', nativeLabel: 'Türkçe' },
  {
    code: 'zh',
    label: 'Chinese',
    nativeLabel: '中文',
    note: 'CJK part boundaries need backend improvements.'
  }
]
const english = ['en'] as const
const common = ['temperature', 'top_p', 'repetition_penalty'] as const
const base = {
  engine: 'chatterbox',
  referenceMinimum: 5,
  maxSpeechTokens: 1000,
  nativeSampleRate: 24000,
  decoderReferenceSeconds: 10,
  referenceLoudnessLufs: null
} as const
export const models: readonly ModelDefinition[] = [
  {
    ...base,
    id: 'auto',
    label: 'Auto',
    description: 'Turbo for English. Multilingual V3 for other languages.',
    parameters: 'Automatic routing',
    repository: null,
    languages: languages.map((l) => l.code),
    sampling: common,
    reactions: false,
    referenceStrict: false,
    conditioningSeconds: 0,
    cudaPrecision: 'full',
    downloadable: false
  },
  {
    ...base,
    id: 'turbo',
    label: 'Chatterbox Turbo',
    description: 'Fast English narration with native reactions.',
    parameters: '350M parameters',
    repository: 'ResembleAI/chatterbox-turbo',
    languages: english,
    sampling: [...common, 'top_k'],
    reactions: true,
    referenceStrict: true,
    conditioningSeconds: 15,
    referenceLoudnessLufs: -27,
    cudaPrecision: 'full',
    downloadable: true
  },
  {
    ...base,
    id: 'nano',
    label: 'Chatterbox Nano',
    description: 'Smallest model, suited to CPU generation.',
    parameters: '110M parameters',
    repository: 'ResembleAI/chatterbox-nano',
    languages: english,
    sampling: [...common, 'top_k'],
    reactions: true,
    referenceStrict: true,
    conditioningSeconds: 15,
    referenceLoudnessLufs: -27,
    cudaPrecision: 'full',
    downloadable: true
  },
  {
    ...base,
    id: 'multilingual',
    label: 'Multilingual V3',
    description: 'Narration and cross-language cloning in 23 languages.',
    parameters: '500M parameters',
    repository: 'ResembleAI/chatterbox',
    languages: languages.map((l) => l.code),
    sampling: [...common, 'min_p', 'exaggeration', 'cfg_weight'],
    reactions: false,
    referenceStrict: false,
    conditioningSeconds: 6,
    cudaPrecision: 'half',
    downloadable: true
  },
  {
    ...base,
    id: 'original',
    label: 'Original Chatterbox',
    description: 'English narration with expression and guidance controls.',
    parameters: '500M parameters',
    repository: 'ResembleAI/chatterbox',
    languages: english,
    sampling: [...common, 'min_p', 'exaggeration', 'cfg_weight'],
    reactions: false,
    referenceStrict: false,
    conditioningSeconds: 6,
    cudaPrecision: 'half',
    downloadable: true
  }
]
export function resolvedModel(
  settings: Pick<GenerationSettings, 'model' | 'language'>
): ModelDefinition {
  const id =
    settings.model === 'auto'
      ? settings.language === 'en'
        ? 'turbo'
        : 'multilingual'
      : settings.model
  return models.find((model) => model.id === id) ?? models[1]
}
export const defaultSettings: GenerationSettings = {
  title: '',
  language: 'en',
  model: 'auto',
  auto_detect: false,
  voice: 'default',
  temperature: 0.8,
  top_p: 0.95,
  top_k: 1000,
  min_p: 0.05,
  repetition_penalty: 1.2,
  exaggeration: 0.5,
  cfg_weight: 0.5,
  chunk_limit: 260,
  gap: 0.38,
  seed: 0,
  speed: 1,
  format: 'wav',
  sample_rate: 24000,
  loudness: true,
  loudness_target: -16,
  trim_silence: true,
  fade_ms: 30,
  normalize_punct: false,
  convert_numbers: false,
  expand_abbrevs: false,
  strip_markdown: true,
  remove_emoji: true,
  pronounce: false
}
export const numericSettings: readonly NumericSetting[] = [
  {
    key: 'speed',
    label: 'Speed',
    min: 0.5,
    max: 2,
    step: 0.05,
    unit: '×',
    description: 'Changes pacing while preserving pitch.',
    group: 'essential'
  },
  {
    key: 'temperature',
    label: 'Temperature',
    min: 0.1,
    max: 1.5,
    step: 0.05,
    description: 'Higher values produce more varied speech.',
    group: 'sampling'
  },
  {
    key: 'top_p',
    label: 'Top-p',
    min: 0,
    max: 1,
    step: 0.01,
    description: 'Nucleus sampling threshold.',
    group: 'sampling'
  },
  {
    key: 'top_k',
    label: 'Top-k',
    min: 0,
    max: 2000,
    step: 10,
    description: 'Turbo and Nano only.',
    group: 'sampling'
  },
  {
    key: 'min_p',
    label: 'Min-p',
    min: 0,
    max: 0.5,
    step: 0.01,
    description: 'Multilingual and Original only.',
    group: 'sampling'
  },
  {
    key: 'repetition_penalty',
    label: 'Repetition penalty',
    min: 1,
    max: 2,
    step: 0.05,
    description: 'Discourages repeated speech tokens.',
    group: 'sampling'
  },
  {
    key: 'exaggeration',
    label: 'Exaggeration',
    min: 0,
    max: 1,
    step: 0.05,
    description: 'Expressiveness for Multilingual and Original.',
    group: 'sampling'
  },
  {
    key: 'cfg_weight',
    label: 'CFG weight',
    min: 0,
    max: 1,
    step: 0.05,
    description: 'Guidance and pacing. Original at zero needs backend verification.',
    group: 'sampling'
  },
  {
    key: 'chunk_limit',
    label: 'Part size',
    min: 60,
    max: 500,
    step: 10,
    unit: ' characters',
    description: 'Shorter parts reduce the risk of the model token limit.',
    group: 'parts'
  },
  {
    key: 'gap',
    label: 'Default pause',
    min: 0,
    max: 3,
    step: 0.05,
    unit: 's',
    description: 'Used by [pause]. Automatic part-boundary behavior is undecided.',
    group: 'parts'
  },
  {
    key: 'seed',
    label: 'Seed',
    min: 0,
    max: 2147483647,
    step: 1,
    description: 'Zero chooses a random seed. Exact GPU reproducibility is not guaranteed.',
    group: 'sampling'
  },
  {
    key: 'fade_ms',
    label: 'Fade in and out',
    min: 0,
    max: 1000,
    step: 10,
    unit: 'ms',
    description: 'Skipped when a clip is shorter than two fades.',
    group: 'mastering'
  },
  {
    key: 'loudness_target',
    label: 'Loudness target',
    min: -24,
    max: -9,
    step: 0.5,
    unit: ' LUFS',
    description: 'Only applies when loudness normalization is enabled.',
    group: 'mastering'
  }
]
export const cleanupSettings = [
  {
    key: 'strip_markdown',
    label: 'Remove Markdown',
    description: 'Keep readable text from formatting, links and headings.'
  },
  {
    key: 'remove_emoji',
    label: 'Remove emoji',
    description: 'Remove emoji and joiners before synthesis.'
  },
  {
    key: 'normalize_punct',
    label: 'Normalize punctuation',
    description: 'Normalize quotes, dashes and repeated punctuation.'
  },
  {
    key: 'expand_abbrevs',
    label: 'Expand abbreviations',
    description: 'Expand the supported English abbreviation list.'
  },
  {
    key: 'convert_numbers',
    label: 'Convert numbers to words',
    description: 'English and Hindi only. Other languages retain numbers.'
  },
  {
    key: 'pronounce',
    label: 'Use pronunciation dictionary',
    description: 'Apply whole-word rules before number conversion.'
  }
] as const
export const reactionTags = [
  'laugh',
  'chuckle',
  'cough',
  'sigh',
  'gasp',
  'groan',
  'sniff',
  'shush',
  'clear throat'
] as const
export const voices: readonly VoiceDefinition[] = [
  {
    id: 'default',
    label: 'Original narrator',
    kind: 'built-in',
    description: 'Uses the selected model’s built-in voice.',
    duration: null,
    previewAvailable: true,
    available: true
  },
  ...(['Male 1', 'Male 2', 'Female 1', 'Female 2', 'Deep / dramatic'] as const).map(
    (label, index): VoiceDefinition => ({
      id: ['male_1', 'male_2', 'female_1', 'female_2', 'deep'][index],
      label,
      kind: 'built-in',
      description: 'Reference recording from the official Chatterbox demo.',
      duration: 12,
      previewAvailable: true,
      available: true
    })
  ),
  ...[
    'Dark gaming voice prompt',
    'Ivr female 01 prompt',
    'Ivr female 02 prompt',
    'Ivr male 01 prompt',
    'Ivr male 02 prompt'
  ].map((label): VoiceDefinition => ({
    id: `file:${label.toLowerCase().replaceAll(' ', '_')}`,
    label: `Recording · ${label}`,
    kind: 'external',
    description: 'Discovered recording. Audition plays the reference.',
    duration: 12,
    previewAvailable: false,
    available: true
  })),
  {
    id: 'custom:calm-narrator-demo',
    label: 'Calm narrator',
    kind: 'custom',
    description: 'Example saved voice. Mock data only.',
    duration: 18.4,
    previewAvailable: true,
    available: true
  }
]

export const settingLabels: Record<keyof GenerationSettings, string> = {
  title: 'Title',
  language: 'Language',
  model: 'Model',
  auto_detect: 'Detect language',
  voice: 'Voice',
  temperature: 'Temperature',
  top_p: 'Top-p',
  top_k: 'Top-k',
  min_p: 'Min-p',
  repetition_penalty: 'Repetition penalty',
  exaggeration: 'Exaggeration',
  cfg_weight: 'CFG weight',
  chunk_limit: 'Part size',
  gap: 'Default pause',
  seed: 'Seed',
  speed: 'Speed',
  format: 'Format',
  sample_rate: 'Sample rate',
  loudness: 'Normalize loudness',
  loudness_target: 'Loudness target',
  trim_silence: 'Trim edge silence',
  fade_ms: 'Fade in and out',
  normalize_punct: 'Normalize punctuation',
  convert_numbers: 'Convert numbers',
  expand_abbrevs: 'Expand abbreviations',
  strip_markdown: 'Remove Markdown',
  remove_emoji: 'Remove emoji',
  pronounce: 'Use dictionary'
}
