import type { GenerationSettings } from './studio'
export interface BatchFile {
  id: string
  name: string
  characters: number
  readable: boolean
}
export interface BatchWorkspace {
  source: 'files' | 'text'
  files: BatchFile[]
  text: string
  splitChapters: boolean
  reviewed: boolean
}
export interface AppPreferences {
  cachePath: string
  tokenConfigured: boolean
  previewBytes: number
  logs: string[]
}
export interface WatermarkResult {
  outputId: string
  state: 'detected' | 'not-detected' | 'unavailable' | 'error'
  score: number | null
  message: string
}
export interface SettingsWorkspace {
  saved: GenerationSettings
  preferences: AppPreferences
}
