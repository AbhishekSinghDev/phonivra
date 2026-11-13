import type { Metadata } from 'next'
import localFont from 'next/font/local'
import { SystemTheme } from '@/components/system-theme'
import './globals.css'

const manrope = localFont({
  src: '../../../../packages/ui/node_modules/@fontsource-variable/manrope/files/manrope-latin-wght-normal.woff2',
  display: 'swap',
  weight: '200 800',
  declarations: [{ prop: 'font-family', value: 'Manrope Variable' }]
})

const title = 'Phonivra | Turn text into speech on your computer'
const description =
  'Turn text into speech with Phonivra. Make a voice from a recording, narrate several chapters at once, and export audio with subtitles.'

export const metadata: Metadata = {
  title,
  description,
  openGraph: { type: 'website', locale: 'en_US', siteName: 'Phonivra', title, description },
  twitter: { card: 'summary', title, description }
}

export default function RootLayout({
  children
}: Readonly<{ children: React.ReactNode }>): React.JSX.Element {
  return (
    <html lang="en" className={manrope.className} suppressHydrationWarning>
      <body className="bg-background font-sans text-foreground antialiased">
        <SystemTheme>{children}</SystemTheme>
      </body>
    </html>
  )
}
