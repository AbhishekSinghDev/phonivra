import Link from 'next/link'
import Image from 'next/image'
import { siteLinks } from '@/components/site-links'
import { Button } from '@phonivra/ui/components/button'

export function DownloadSection(): React.JSX.Element {
  return (
    <section
      id="download"
      aria-labelledby="download-title"
      className="mx-auto max-w-6xl px-6 py-16 sm:px-12 sm:py-24"
    >
      <div className="relative isolate overflow-hidden border-y border-card-edge py-16 sm:py-20">
        <Image
          src="/images/background.svg"
          alt=""
          aria-hidden="true"
          fill
          sizes="(max-width: 1152px) 100vw, 1152px"
          className="pointer-events-none -z-10 object-cover opacity-30 invert hue-rotate-180 dark:invert-0 dark:hue-rotate-0"
        />
        <div className="mx-auto flex max-w-2xl flex-col items-center gap-6 px-2 text-center sm:px-6">
          <h2
            id="download-title"
            className="text-4xl leading-tight font-medium tracking-tight text-balance sm:text-5xl lg:text-6xl"
          >
            Install <span className="highlight">Phonivra</span>
          </h2>
          <p className="max-w-lg text-base leading-relaxed text-muted-foreground">
            Check GitHub Releases for the Debian-based Linux x64 installer, or run the desktop app
            from source.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Button asChild size="lg" className="studio-primary">
              <Link href="/docs/install#run-from-source">Run from source</Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href={siteLinks.releases}>Check for an installer</Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}
