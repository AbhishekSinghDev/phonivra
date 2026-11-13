import Link from 'next/link'
import { Button } from '@phonivra/ui/components/button'

export function HowItWorksSection(): React.JSX.Element {
  return (
    <section
      id="how-it-works"
      aria-labelledby="workflow-title"
      className="mx-auto grid max-w-6xl gap-10 px-6 py-16 sm:px-12 sm:py-24 lg:grid-cols-5 lg:gap-20"
    >
      <header className="flex flex-col items-start gap-6 lg:col-span-2">
        <h2
          id="workflow-title"
          className="text-3xl leading-tight font-medium tracking-tight text-balance sm:text-4xl"
        >
          How to make <br /> <span className="highlight">your first narration</span>
        </h2>
        <Button variant="outline" asChild>
          <Link href="#download">Get started</Link>
        </Button>
      </header>

      <ol aria-label="Narration workflow" className="flex min-w-0 flex-col lg:col-span-3">
        <li className="grid grid-cols-12 gap-3 border-t border-card-edge py-8 first:pt-6 sm:gap-5">
          <span aria-hidden="true" className="col-span-1 text-sm text-highlight tabular-nums">
            01
          </span>
          <div className="col-span-11 flex min-w-0 flex-col gap-4">
            <h3 className="font-montserrat text-xl font-medium tracking-tight">Add your script</h3>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Write, paste, or import your script. Add a pause wherever you want a little space
              between lines.
            </p>
            <blockquote className="mt-1 border-l border-card-edge pl-5 text-base leading-loose">
              The room went quiet.
              <br />
              <code className="text-sm text-highlight">[pause=1.5]</code>
              <br />
              Then someone knocked.
            </blockquote>
          </div>
        </li>

        <li className="grid grid-cols-12 gap-3 border-t border-card-edge py-8 sm:gap-5">
          <span aria-hidden="true" className="col-span-1 text-sm text-highlight tabular-nums">
            02
          </span>
          <div className="col-span-11 flex min-w-0 flex-col gap-4">
            <h3 className="font-montserrat text-xl font-medium tracking-tight">Choose a voice</h3>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Pick a voice and set the pace. Choose a speech model or let Phonivra pick one for the
              language.
            </p>
            <dl className="mt-1 flex flex-wrap gap-x-8 gap-y-4 text-sm">
              {[
                { label: 'Voice', value: 'Model default' },
                { label: 'Language', value: 'English' },
                { label: 'Model', value: 'Auto' }
              ].map((setting) => (
                <div key={setting.label} className="flex flex-col gap-2">
                  <dt className="text-xs text-muted-foreground">{setting.label}</dt>
                  <dd>{setting.value}</dd>
                </div>
              ))}
            </dl>
          </div>
        </li>

        <li className="grid grid-cols-12 gap-3 border-y border-card-edge py-8 sm:gap-5">
          <span aria-hidden="true" className="col-span-1 text-sm text-highlight tabular-nums">
            03
          </span>
          <div className="col-span-11 flex min-w-0 flex-col gap-4">
            <h3 className="font-montserrat text-xl font-medium tracking-tight">
              Listen and export
            </h3>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Generate the narration and listen to the result. Save the audio on its own or include
              subtitles, a transcript, and the settings used to create it.
            </p>
            <dl className="mt-1 grid gap-3 text-sm sm:grid-cols-2">
              <div className="flex flex-col gap-2">
                <dt className="text-xs text-muted-foreground">Output formats</dt>
                <dd className="leading-relaxed">WAV · MP3 · FLAC · OGG · M4A</dd>
              </div>
              <div className="flex flex-col gap-2">
                <dt className="text-xs text-muted-foreground">Optional files</dt>
                <dd className="leading-relaxed">SRT · VTT · TXT · JSON</dd>
              </div>
            </dl>
          </div>
        </li>
      </ol>
    </section>
  )
}
