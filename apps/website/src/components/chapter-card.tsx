import { Card, CardBody, CardText, CardTitle } from '@phonivra/ui/components/card'

export function ChapterCard(): React.JSX.Element {
  return (
    <Card>
      <figure
        aria-label="Markdown headings become separate batch items with one shared voice"
        className="flex flex-1 flex-col justify-center gap-4 px-6 pt-8 pb-6 sm:px-8"
      >
        <ol className="flex flex-col gap-3 text-sm">
          {['Opening', 'The main story', 'Closing'].map((chapter) => (
            <li key={chapter} className="flex items-center gap-4 border-b border-card-edge pb-3">
              <span className="font-mono text-highlight" aria-hidden="true">
                #
              </span>
              {chapter}
            </li>
          ))}
        </ol>
        <span className="text-xs text-muted-foreground">Separate items. One shared voice.</span>
      </figure>
      <div className="mx-2 mb-3 sm:mx-4">
        <CardBody>
          <CardTitle>A chapter at a time.</CardTitle>
          <CardText>
            Plan batch items from Markdown headings, then review them before generation.
          </CardText>
        </CardBody>
      </div>
    </Card>
  )
}
