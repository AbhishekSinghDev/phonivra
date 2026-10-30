import { Badge } from '@phonivra/ui/components/badge'

export function BatchVisual(): React.JSX.Element {
  return (
    <figure
      data-feature-visual=""
      className="flex flex-col justify-center gap-7 overflow-hidden rounded-xl bg-muted p-5 sm:p-8"
    >
      <div className="flex items-center justify-between gap-3">
        <p className="font-montserrat text-sm font-medium">One script. A chapter plan.</p>
        <Badge variant="outline">Example</Badge>
      </div>
      <div className="grid items-center gap-5 sm:grid-cols-2">
        <pre className="overflow-hidden rounded-lg border border-card-edge bg-background p-4 font-mono text-xs leading-loose text-muted-foreground">
          <code>
            {
              '# Introduction\nEvery story starts…\n\n# A place to begin\nA quiet thought…\n\n# A different shore\nA new perspective…'
            }
          </code>
        </pre>
        <ol className="flex flex-col gap-3 text-sm">
          {['Introduction', 'A place to begin', 'A different shore'].map((chapter, index) => (
            <li key={chapter} className="flex items-center gap-3 border-b border-card-edge py-3">
              <span className="text-xs text-muted-foreground tabular-nums">{index + 1}</span>
              <span>{chapter}</span>
            </li>
          ))}
        </ol>
      </div>
    </figure>
  )
}
