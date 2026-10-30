import Link from 'next/link'
import Image from 'next/image'
import { Badge } from '@phonivra/ui/components/badge'
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
            Your next voice.
            <br />
            <span className="highlight">Still taking shape.</span>
          </h2>
          <Badge variant="outline">In development</Badge>
          <p className="max-w-lg text-base leading-relaxed text-muted-foreground">
            The studio interface is built. The local speech engine and installer packaging are still
            in development. There’s no public download or announced release date yet.
          </p>
          <Button asChild size="lg" className="studio-primary">
            <Link href="#faq">
              Explore the release FAQ
              <svg
                data-icon="inline-end"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                aria-hidden="true"
              >
                <path d="M7 17 17 7M7 7h10v10" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </Link>
          </Button>
        </div>
      </div>

      <ul aria-label="Installer availability" className="grid gap-6 py-8 sm:grid-cols-3 sm:gap-8">
        {['Windows', 'macOS', 'Linux'].map((platform) => (
          <li
            key={platform}
            className="flex flex-col gap-3 border-b border-card-edge pb-6 sm:items-center sm:border-b-0 sm:pb-0 sm:text-center"
          >
            <h3 className="font-montserrat text-lg font-medium">{platform}</h3>
            <p className="text-sm">Installer unavailable</p>
            <p className="text-xs leading-relaxed text-muted-foreground">
              Distribution format and requirements to be confirmed.
            </p>
          </li>
        ))}
      </ul>
      <p className="mx-auto max-w-xl text-center text-xs leading-relaxed text-muted-foreground">
        Platform-aware window support exists. Release platforms, architectures and minimum hardware
        requirements are undecided.
      </p>
    </section>
  )
}
