import type { ReactNode } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'

export function SiteShell({ children }: { children: ReactNode }): React.JSX.Element {
  return (
    <div id="top" className="relative isolate overflow-x-clip">
      <Link
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-30 focus:bg-background focus:p-4"
      >
        Skip to content
      </Link>
      <Image
        src="/images/background.svg"
        loading="eager"
        width={2842}
        height={1132}
        alt=""
        aria-hidden="true"
        data-site-backdrop=""
        className="min-h-160 object-cover object-top pointer-events-none absolute inset-x-0 top-0 -z-10 mx-auto w-full select-none invert hue-rotate-180 dark:invert-0 dark:hue-rotate-0"
      />
      <SiteHeader />
      <main id="main">{children}</main>
      <SiteFooter />
    </div>
  )
}
