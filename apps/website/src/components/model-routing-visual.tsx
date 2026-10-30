import { Badge } from '@phonivra/ui/components/badge'

export function ModelRoutingVisual(): React.JSX.Element {
  return (
    <figure
      data-feature-visual=""
      className="flex flex-col justify-center gap-7 overflow-hidden rounded-xl bg-muted p-5 sm:p-8"
    >
      <div className="flex flex-col items-center gap-3">
        <Badge variant="outline">Auto routing</Badge>
        <p className="font-montserrat text-lg font-medium">A model for the language.</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-4 border-t border-card-edge pt-5">
          <p className="text-xs text-muted-foreground">English</p>
          <p className="font-montserrat text-lg font-medium text-highlight">Chatterbox Turbo</p>
          <p className="text-xs text-muted-foreground">350M parameters</p>
        </div>
        <div className="flex flex-col gap-4 border-t border-card-edge pt-5">
          <p className="text-xs text-muted-foreground">Other supported languages</p>
          <p className="font-montserrat text-lg font-medium text-highlight">Multilingual V3</p>
          <p className="text-xs text-muted-foreground">500M parameters</p>
        </div>
      </div>
      <p className="text-center text-xs leading-relaxed text-muted-foreground">
        Nano and Original Chatterbox can also be selected in the model catalog.
      </p>
    </figure>
  )
}
