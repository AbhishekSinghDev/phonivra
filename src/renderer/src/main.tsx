import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import { AppErrorBoundary } from '@/components/app-error-boundary'
import { StartupError } from '@/components/startup-error'
import { ThemeProvider, applyTheme } from '@/components/theme-provider'
import './assets/main.css'

// Prevent file drops from navigating the renderer and Ctrl/trackpad pinch zoom.
document.addEventListener('dragover', (event) => event.preventDefault())
document.addEventListener('drop', (event) => event.preventDefault())
document.addEventListener(
  'wheel',
  (event) => {
    if (event.ctrlKey) event.preventDefault()
  },
  { passive: false }
)
document.addEventListener('gesturestart', (event) => event.preventDefault())

const root = createRoot(document.getElementById('root')!)
const browser = !navigator.userAgent.includes('Electron/')
try {
  if (!window.api?.theme?.get) {
    throw new Error(
      browser
        ? 'The desktop API is not available in a browser tab. Start the app with pnpm dev and use the Phonivra window.'
        : 'Phonivra could not load its desktop API. The preload script did not initialize.'
    )
  }
  if (!window.api.studio)
    throw new Error(
      'The desktop API is from an older build. Restart pnpm dev to rebuild the preload script.'
    )
  const initial = await window.api.theme.get()
  applyTheme(initial)
  root.render(
    <StrictMode>
      <AppErrorBoundary>
        <ThemeProvider initial={initial}>
          <App />
        </ThemeProvider>
      </AppErrorBoundary>
    </StrictMode>
  )
} catch (error) {
  document.documentElement.classList.toggle(
    'dark',
    window.matchMedia('(prefers-color-scheme: dark)').matches
  )
  document.documentElement.dataset.themeReady = 'true'
  root.render(
    <StartupError
      browser={browser}
      message={
        error instanceof Error ? error.message : 'Phonivra could not connect to its desktop API.'
      }
    />
  )
}
