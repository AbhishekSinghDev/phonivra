import { useCallback, useEffect, useState, type ReactNode } from 'react'
import type { Theme, ThemeState } from '../../../shared/api'
import { ThemeContext } from '@/hooks/use-theme'
import { notify } from '@/lib/notify'

export function applyTheme(state: ThemeState): void {
  document.documentElement.classList.toggle('dark', state.dark)
  document.documentElement.style.colorScheme = state.dark ? 'dark' : 'light'
  document.documentElement.dataset.themeReady = 'true'
}

export function ThemeProvider({
  initial,
  children
}: {
  initial: ThemeState
  children: ReactNode
}): React.JSX.Element {
  const [state, setState] = useState(initial)
  const receive = useCallback((next: ThemeState) => {
    applyTheme(next)
    setState(next)
  }, [])

  useEffect(() => window.api.theme.onChange(receive), [receive])

  const setTheme = useCallback(
    async (theme: Theme) => {
      try {
        receive(await window.api.theme.set(theme))
      } catch {
        notify('Theme preference could not be saved')
      }
    },
    [receive]
  )

  return (
    <ThemeContext
      value={{ theme: state.source, resolvedTheme: state.dark ? 'dark' : 'light', setTheme }}
    >
      {children}
    </ThemeContext>
  )
}
