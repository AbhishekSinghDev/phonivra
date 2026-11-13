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
            Get <span className="highlight">Phonivra</span>
          </h2>
          <p className="max-w-lg text-base leading-relaxed text-muted-foreground">
            Follow the setup guide to run Phonivra from source, or visit GitHub Releases to check
            for an installer.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Button asChild size="lg" className="studio-primary">
              <Link href={siteLinks.setup}>Run from source</Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href={siteLinks.releases}>View GitHub Releases</Link>
            </Button>
          </div>
        </div>
      </div>

      <p className="mx-auto max-w-xl py-8 text-center text-sm leading-relaxed text-muted-foreground">
        Installer builds target Windows x64, Macs with Apple silicon, and Linux x64 with Debian
        packages. Download your speech model inside the app.
      </p>
    </section>
  )
}
