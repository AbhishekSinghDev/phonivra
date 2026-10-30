import { Badge } from '@phonivra/ui/components/badge'

export function LibraryVisual(): React.JSX.Element {
  return (
    <figure
      data-feature-visual=""
      className="flex flex-col justify-center gap-7 overflow-hidden rounded-xl bg-muted p-5 sm:p-8"
    >
      <div className="flex items-center gap-3 border-b border-card-edge pb-5">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          className="size-8 shrink-0 text-highlight"
          aria-hidden="true"
        >
          <path
            d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z"
            strokeLinejoin="round"
          />
          <path d="M14 2v6h6M8 15v2m4-5v7m4-5v3" strokeLinecap="round" />
        </svg>
        <div>
          <p className="font-montserrat text-base font-medium">A place to begin</p>
          <p className="mt-1 text-xs text-muted-foreground">
            An example take and its planned exports
          </p>
        </div>
      </div>
      <div className="flex flex-col gap-3">
        <p className="text-xs text-muted-foreground">Audio formats</p>
        <div className="flex flex-wrap gap-2">
          {['WAV', 'MP3', 'FLAC', 'OGG', 'M4A'].map((format) => (
            <Badge key={format} variant="outline">
              {format}
            </Badge>
          ))}
        </div>
      </div>
      <dl className="grid grid-cols-2 gap-x-5 gap-y-4 text-sm">
        {[
          { file: 'SRT + VTT', label: 'Subtitles' },
          { file: 'TXT', label: 'Prepared transcript' },
          { file: 'JSON', label: 'Generation metadata' },
          { file: 'Seed + settings', label: 'Take details' }
        ].map((item) => (
          <div key={item.file}>
            <dt className="font-medium">{item.file}</dt>
            <dd className="mt-1 text-xs text-muted-foreground">{item.label}</dd>
          </div>
        ))}
      </dl>
    </figure>
  )
}
