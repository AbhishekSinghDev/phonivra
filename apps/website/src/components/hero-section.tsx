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
            Your words.
            <br />A voice of <span className="highlight">their own.</span>
          </h1>
          <p className="max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
            Turn scripts into narration on your computer. Create voices from recordings, generate
            chapters in batches, and export audio with subtitles.
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
            Scripts, reference recordings, and generated audio stay on your device. Download a
            speech model once to generate offline.
          </p>
        </div>
      </div>

      <DesktopPreview />
    </section>
  )
}
