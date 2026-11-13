import { Badge } from '@phonivra/ui/components/badge'

export function ModelRoutingVisual(): React.JSX.Element {
  return (
    <figure
      data-feature-visual=""
      className="flex flex-col justify-center gap-7 overflow-hidden rounded-xl bg-muted p-5 sm:p-8"
    >
      <div className="flex flex-col items-center gap-3">
        <Badge variant="outline">Speech models</Badge>
        <p className="font-montserrat text-lg font-medium">Choose a model for your script</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="flex flex-col gap-4 border-t border-card-edge pt-5">
          <p className="text-xs text-muted-foreground">English with reactions</p>
          <p className="font-montserrat text-lg font-medium text-highlight">Chatterbox Turbo</p>
          <p className="text-xs text-muted-foreground">350M parameters</p>
        </div>
        <div className="flex flex-col gap-4 border-t border-card-edge pt-5">
          <p className="text-xs text-muted-foreground">Default for 23 languages</p>
          <p className="font-montserrat text-lg font-medium text-highlight">Multilingual V3</p>
          <p className="text-xs text-muted-foreground">500M parameters</p>
        </div>
        <div className="flex flex-col gap-4 border-t border-card-edge pt-5">
          <p className="text-xs text-muted-foreground">11 Indian languages</p>
          <p className="font-montserrat text-lg font-medium text-highlight">AI4Bharat IndicF5</p>
          <p className="text-xs text-muted-foreground">400M parameters</p>
        </div>
      </div>
      <p className="text-center text-xs leading-relaxed text-muted-foreground">
        Auto selects Multilingual V3 or IndicF5 by language. Choose Turbo to add English reaction
        tags.
      </p>
    </figure>
  )
}
