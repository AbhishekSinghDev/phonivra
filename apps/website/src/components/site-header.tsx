'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Button } from '@phonivra/ui/components/button'
import { cn } from '@phonivra/ui/lib/utils'
import { GitHubIcon } from '@/components/github-icon'
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
          href="/docs"
        >
          Docs
        </Link>
        <Link
          className="hidden text-muted-foreground transition-colors hover:text-foreground lg:inline"
          href="#download"
        >
          Get started
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
              <GitHubIcon />
            </Link>
          </Button>
          <ThemeToggle />
        </div>
      </nav>
    </header>
  )
}
