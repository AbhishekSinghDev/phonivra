import type { DesktopAPI } from '../../shared/api'

declare global {
  const __PHONIVRA_VERSION__: string

  interface Window {
    api: DesktopAPI
  }
}
