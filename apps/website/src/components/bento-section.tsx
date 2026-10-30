import { PronunciationCard } from '@/components/pronunciation-card'
import { LocalEngineCard } from '@/components/local-engine-card'
import { ChapterCard } from '@/components/chapter-card'
import { AudioExportCard } from '@/components/audio-export-card'

export function BentoSection(): React.JSX.Element {
  return (
    <section
      id="details"
      aria-labelledby="details-title"
      className="mx-auto max-w-6xl px-6 py-16 sm:px-12 sm:py-24"
    >
      <header className="mb-10 flex flex-col gap-5 sm:mb-12 lg:flex-row lg:items-end lg:justify-between lg:gap-12">
        <h2
          id="details-title"
          className="text-3xl leading-tight font-medium tracking-tight text-balance sm:text-4xl"
        >
          The details behind
          <br />
          <span className="highlight">Every take.</span>
        </h2>
        <p className="max-w-sm text-sm leading-relaxed text-muted-foreground">
          A closer look at what’s planned for the local engine. Thoughtful controls, from preparing
          your words to carrying the finished work forward.
        </p>
      </header>

      <div className="grid gap-4 lg:grid-cols-3">
        <PronunciationCard />
        <LocalEngineCard />
        <ChapterCard />
        <AudioExportCard />
      </div>
    </section>
  )
}
