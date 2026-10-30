import Link from 'next/link'
import { Badge } from '@phonivra/ui/components/badge'
import { SiteLogo } from '@/components/site-logo'
import { siteLinks } from '@/components/site-links'

const linkGroups = [
  {
    title: 'Explore',
    links: [
      { label: 'How it works', href: '#how-it-works' },
      { label: 'The studio', href: '#studio' },
      { label: 'The details', href: '#details' },
      { label: 'Speech models', href: '#models' }
    ]
  },
  {
    title: 'Before you begin',
    links: [
      { label: 'Technology', href: '#foundations' },
      { label: 'Questions', href: '#faq' },
      { label: 'Release status', href: '#download' },
      { label: 'GitHub repository', href: siteLinks.repository }
    ]
  }
] as const

export function SiteFooter(): React.JSX.Element {
  return (
    <footer className="border-t border-card-edge">
      <div className="mx-auto max-w-6xl px-6 pt-12 pb-6 sm:px-12 sm:pt-16">
        <div className="grid gap-10 pb-12 sm:gap-12 lg:grid-cols-2 lg:pb-16">
          <div className="flex flex-col items-start gap-5">
            <SiteLogo size={40} />
            <p className="max-w-xs text-sm leading-relaxed text-muted-foreground">
              A desktop text-to-speech studio being built for your machine. A space for your words
              to find their voice.
            </p>
            <Badge variant="outline">In development</Badge>
          </div>

          <div className="grid grid-cols-2 gap-6 sm:gap-10">
            {linkGroups.map((group) => (
              <nav key={group.title} aria-label={`Footer: ${group.title}`}>
                <h2 className="font-montserrat text-sm font-medium">{group.title}</h2>
                <ul className="mt-5 flex flex-col gap-4">
                  {group.links.map((link) => (
                    <li key={link.href}>
                      <Link
                        href={link.href}
                        target={link.href.startsWith('https://') ? '_blank' : undefined}
                        rel={link.href.startsWith('https://') ? 'noopener noreferrer' : undefined}
                        className="text-sm leading-relaxed text-muted-foreground transition-colors hover:text-brand"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>
            ))}
          </div>
        </div>

        <div className="flex flex-col items-start justify-between gap-4 border-t border-card-edge py-6 text-xs sm:flex-row sm:items-center">
          <div className="flex flex-col gap-2 text-muted-foreground">
            <p>
              Built with love by{' '}
              <Link
                href={siteLinks.author}
                target="_blank"
                rel="noopener noreferrer"
                className="text-foreground underline underline-offset-4 transition-colors hover:text-brand"
              >
                Abhishek
              </Link>
            </p>
          </div>
          <Link href="#top" className="flex items-center gap-2 transition-colors hover:text-brand">
            Back to top
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              className="size-4"
              aria-hidden="true"
            >
              <path d="M12 19V5m-5 5 5-5 5 5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>
        </div>
      </div>
    </footer>
  )
}
