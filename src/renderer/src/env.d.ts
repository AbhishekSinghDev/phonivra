import type { DesktopAPI } from '../../shared/api'

declare global {
  interface Window {
    api: DesktopAPI
  }
}
