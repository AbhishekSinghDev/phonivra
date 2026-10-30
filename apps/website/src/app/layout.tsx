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

export const metadata: Metadata = {
  title: 'Phonivra | A local text-to-speech studio, in development',
  description:
    'Explore Phonivra, a desktop text-to-speech studio designed for on-device narration, custom voices and batch scripts. Engine integration and installers are still in development.',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    siteName: 'Phonivra',
    title: 'Phonivra | Your words. A voice of their own.',
    description:
      'A desktop text-to-speech studio in development. Explore the interface, planned capabilities and release status.'
  },
  twitter: {
    card: 'summary',
    title: 'Phonivra | A local text-to-speech studio',
    description:
      'Interface built. Speech engine still to come. Explore Phonivra and check release availability.'
  }
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
