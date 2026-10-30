import { Card, CardBody, CardText, CardTitle } from '@phonivra/ui/components/card'

export function AudioExportCard(): React.JSX.Element {
  return (
    <Card className="lg:col-span-2">
      <figure
        aria-label="Planned audio formats: WAV, MP3, FLAC, OGG and M4A, with SRT, VTT, TXT and JSON companions"
        className="grid flex-1 items-center gap-6 px-6 pt-8 pb-6 sm:grid-cols-2 sm:gap-8 sm:px-8"
      >
        <div className="flex flex-col gap-4">
          <p className="text-xs text-muted-foreground">Audio</p>
          <p className="font-montserrat text-4xl font-medium tracking-tight text-highlight">WAV</p>
          <p className="text-xs text-muted-foreground">Native mono · 24 kHz</p>
          <p className="text-sm">MP3 · FLAC · OGG · M4A</p>
        </div>
        <dl className="flex flex-col gap-3 text-sm">
          {[
            { format: 'SRT / VTT', description: 'Approx. subtitles' },
            { format: 'TXT', description: 'Transcript' },
            { format: 'JSON', description: 'Take metadata' }
          ].map((companion) => (
            <div
              key={companion.format}
              className="flex items-center justify-between gap-3 border-b border-card-edge pb-3"
            >
              <dt className="font-mono text-xs">{companion.format}</dt>
              <dd className="text-xs text-muted-foreground">{companion.description}</dd>
            </div>
          ))}
        </dl>
      </figure>
      <div className="mx-2 mb-3 sm:mx-4">
        <CardBody>
          <CardTitle>Audio, with the context attached.</CardTitle>
          <CardText>Planned audio and companion exports. Non-WAV formats require FFmpeg.</CardText>
        </CardBody>
      </div>
    </Card>
  )
}
