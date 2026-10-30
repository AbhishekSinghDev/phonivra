import type { Metadata } from 'next'
import { SystemTheme } from '@/components/system-theme'
import './globals.css'

export const metadata: Metadata = {
  title: 'Phonivra',
  description: 'Phonivra desktop text-to-speech studio.'
}

export default function RootLayout({
  children
}: Readonly<{ children: React.ReactNode }>): React.JSX.Element {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="bg-background font-sans text-foreground antialiased">
        <SystemTheme>{children}</SystemTheme>
      </body>
    </html>
  )
}
