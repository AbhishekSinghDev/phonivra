import type { ReviewAPI, StudioAPI } from './studio'

export type Theme = 'light' | 'dark' | 'system'

export interface ThemeState {
  source: Theme
  dark: boolean
}

export type WindowAction = 'minimize' | 'maximize' | 'close'

export interface DesktopAPI {
  readonly studio: StudioAPI
  readonly review: ReviewAPI

  readonly platform: 'darwin' | 'win32' | 'linux'
  readonly window: {
    // Stubs: custom UI actions still call notify until real controls are needed.
    control: (action: WindowAction) => Promise<void>
  }
  readonly theme: {
    get: () => Promise<ThemeState>
    set: (theme: Theme) => Promise<ThemeState>
    onChange: (callback: (state: ThemeState) => void) => () => void
  }
}
