import { Card, CardBody, CardText, CardTitle } from '@phonivra/ui/components/card'

export function PronunciationCard(): React.JSX.Element {
  return (
    <Card className="lg:col-span-2">
      <figure
        aria-label="Pronunciation example where API is read as A P I"
        className="flex flex-1 flex-col justify-center gap-5 px-6 pt-8 pb-5 sm:px-8"
      >
        <div className="flex items-center justify-between gap-3">
          <span className="text-xs text-muted-foreground">Pronunciation dictionary</span>
          <code className="text-sm text-highlight">API = A P I</code>
        </div>
        <dl className="grid gap-5 border-y border-card-edge py-5 sm:grid-cols-2 sm:gap-8">
          <div>
            <dt className="text-xs text-muted-foreground">Written</dt>
            <dd className="mt-2 text-lg tracking-tight">The API is ready.</dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Read aloud</dt>
            <dd className="mt-2 text-lg tracking-tight">
              The <span className="text-highlight">A P I</span> is ready.
            </dd>
          </div>
        </dl>
      </figure>
      <div className="mx-2 mb-3 sm:mx-4">
        <CardBody>
          <CardTitle>Set how words are pronounced</CardTitle>
          <CardText>
            Add names, acronyms, and tricky words to the dictionary without editing your script.
          </CardText>
        </CardBody>
      </div>
    </Card>
  )
}
