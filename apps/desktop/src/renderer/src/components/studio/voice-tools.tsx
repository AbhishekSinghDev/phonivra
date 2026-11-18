import { HugeiconsIcon } from '@hugeicons/react'
import { AudioLinesIcon, PlayIcon } from '@hugeicons/core-free-icons'
import { Button } from '@phonivra/ui/components/button'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger
} from '@phonivra/ui/components/sheet'
import { Separator } from '@phonivra/ui/components/separator'
import { ScrollArea } from '@phonivra/ui/components/scroll-area'
import { ReferenceAttachment } from '@/components/studio/reference-attachment'
import { VoicePresetControls } from '@/components/studio/voice-preset-controls'
import { AudioTransport } from '@/components/studio/audio-transport'
import { activePhases } from '@/components/studio/job-status'
import { act } from '@/lib/actions'
import { useStudioStore } from '@/stores/studio-store'

export function VoiceTools(): React.JSX.Element | null {
  const snapshot = useStudioStore((state) => state.snapshot)
  if (!snapshot) return null
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm">
          <HugeiconsIcon icon={AudioLinesIcon} data-icon="inline-start" aria-hidden="true" />
          Voice reference
        </Button>
      </SheetTrigger>
      <SheetContent className="sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>Voice reference</SheetTitle>
          <SheetDescription>
            An attached recording takes priority over the selected voice preset.
          </SheetDescription>
        </SheetHeader>
        <ScrollArea className="min-h-0 flex-1 px-6 pb-6">
          <div className="flex flex-col gap-6">
            <ReferenceAttachment reference={snapshot.reference} />
            <Separator />
            <VoicePresetControls />
            <Separator />
            <div className="flex flex-col gap-3">
              <h3 className="text-sm font-medium">Voice preview</h3>
              <p className="text-sm text-muted-foreground">
                Listen to a short sample with the current voice and model.
              </p>
              <Button
                size="sm"
                variant="outline"
                className="self-start"
                disabled={activePhases.has(snapshot.job.phase)}
                onClick={() =>
                  act('Generate voice preview', { type: 'job.start', kind: 'preview' })
                }
              >
                <HugeiconsIcon icon={PlayIcon} data-icon="inline-start" aria-hidden="true" />
                Generate voice preview
              </Button>
              {snapshot.preview && (
                <AudioTransport
                  id={snapshot.preview.id}
                  title="Voice preview"
                  duration={snapshot.preview.duration}
                />
              )}
            </div>
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  )
}
