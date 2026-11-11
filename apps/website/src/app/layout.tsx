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

const title = 'Phonivra | Local text-to-speech studio'
const description =
  'Turn scripts into narration on your computer. Create voice presets from recordings, generate chapters in batches, and export audio with subtitles and transcripts.'

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
