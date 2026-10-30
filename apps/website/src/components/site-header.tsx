'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Button } from '@phonivra/ui/components/button'
import { cn } from '@phonivra/ui/lib/utils'
import { SiteLogo } from '@/components/site-logo'
import { siteLinks } from '@/components/site-links'
import { ThemeToggle } from '@/components/theme-toggle'

export function SiteHeader(): React.JSX.Element {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    function updateScroll(): void {
      setScrolled(window.scrollY > 16)
    }
    updateScroll()
    window.addEventListener('scroll', updateScroll, { passive: true })
    return () => window.removeEventListener('scroll', updateScroll)
  }, [])

  return (
    <header
      className={cn(
        'sticky top-0 z-20 mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-6 py-6 transition-colors sm:px-12',
        scrolled && 'bg-background/95 backdrop-blur-sm'
      )}
    >
      <SiteLogo />
      <nav aria-label="Main navigation" className="flex items-center gap-2 text-sm sm:gap-8">
        <Link
          className="hidden text-muted-foreground transition-colors hover:text-foreground sm:inline"
          href="#studio"
        >
          The studio
        </Link>
        <Link
          className="hidden text-muted-foreground transition-colors hover:text-foreground sm:inline"
          href="#models"
        >
          Models
        </Link>
        <Link
          className="text-muted-foreground transition-colors hover:text-foreground"
          href="#download"
        >
          Availability
        </Link>
        <div className="flex items-center">
          <Button variant="ghost" size="icon" asChild>
            <Link
              href={siteLinks.repository}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Phonivra on GitHub"
              title="Phonivra on GitHub"
            >
              <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M12 .75a11.25 11.25 0 0 0-3.56 21.92c.56.1.77-.24.77-.54v-2.1c-3.13.68-3.79-1.33-3.79-1.33-.51-1.3-1.25-1.65-1.25-1.65-1.02-.7.08-.68.08-.68 1.13.08 1.72 1.16 1.72 1.16 1 1.72 2.63 1.22 3.27.93.1-.73.39-1.22.71-1.5-2.5-.29-5.13-1.25-5.13-5.56 0-1.23.44-2.23 1.16-3.02-.12-.28-.5-1.43.11-2.98 0 0 .95-.3 3.1 1.15a10.8 10.8 0 0 1 5.63 0c2.15-1.46 3.1-1.15 3.1-1.15.61 1.55.23 2.7.11 2.98.72.79 1.16 1.79 1.16 3.02 0 4.32-2.63 5.27-5.14 5.55.4.35.76 1.03.76 2.08v3.1c0 .3.2.65.77.54A11.25 11.25 0 0 0 12 .75Z" />
              </svg>
            </Link>
          </Button>
          <ThemeToggle />
        </div>
      </nav>
    </header>
  )
}
