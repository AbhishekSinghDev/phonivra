import Link from 'next/link'
import { Button } from '@phonivra/ui/components/button'
import { Badge } from '@phonivra/ui/components/badge'
import { DesktopPreview } from '@/components/desktop-preview'

export function HeroSection(): React.JSX.Element {
  return (
    <section
      aria-labelledby="hero-title"
      className="mx-auto max-w-6xl px-6 pt-12 pb-16 sm:px-12 sm:pt-20 sm:pb-24"
    >
      <div className="grid items-end gap-10 lg:grid-cols-3 lg:gap-12">
        <div className="flex flex-col items-start gap-6 lg:col-span-2">
          <h1
            id="hero-title"
            className="max-w-2xl text-5xl leading-tight font-semibold tracking-tight text-balance sm:text-6xl"
          >
            Turn your scripts
            <br />
            into <span className="highlight">spoken audio.</span>
          </h1>
          <p className="max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
            Use the default voice or create one from a recording. Then export your narration with
            subtitles and a transcript.
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <Button asChild size="lg" className="studio-primary">
              <Link href="#download">
                Get started
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  data-icon="inline-end"
                  aria-hidden="true"
                >
                  <path d="M6 18 18 6M6 6h12v12" />
                </svg>
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="#studio">Explore the studio</Link>
            </Button>
          </div>
        </div>
        <div className="flex max-w-sm flex-col items-start gap-4 border-t border-card-edge pt-5 lg:mb-1">
          <Badge variant="outline">Open source</Badge>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Your scripts, recordings, and audio stay on your computer. Once you download a speech
            model, you can make narration offline.
          </p>
        </div>
      </div>

      <DesktopPreview />
    </section>
  )
}
