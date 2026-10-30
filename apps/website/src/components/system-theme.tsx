'use client'

import { ThemeProvider } from 'next-themes'
import type { ReactNode } from 'react'

export function SystemTheme({ children }: { children: ReactNode }): React.JSX.Element {
  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
      {children}
    </ThemeProvider>
  )
}
