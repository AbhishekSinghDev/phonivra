import { HugeiconsIcon } from '@hugeicons/react'
import { AudioLinesIcon, PlayIcon } from '@hugeicons/core-free-icons'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger
} from '@/components/ui/sheet'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { ReferenceAttachment } from '@/components/studio/reference-attachment'
import { VoicePresetControls } from '@/components/studio/voice-preset-controls'
import { AudioTransport } from '@/components/studio/audio-transport'
import { activePhases } from '@/components/studio/job-status'
import { act } from '@/lib/actions'
import { notify } from '@/lib/notify'
import { useStudioStore } from '@/stores/studio-store'

export function VoiceTools(): React.JSX.Element | null {
  const snapshot = useStudioStore((state) => state.snapshot)
  if (!snapshot) return null
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm" onClick={() => notify('Voice tools clicked')}>
          <HugeiconsIcon icon={AudioLinesIcon} data-icon="inline-start" aria-hidden="true" />
          Voice reference
        </Button>
      </SheetTrigger>
      <SheetContent className="sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>Voice reference</SheetTitle>
          <SheetDescription>
            Clone a voice from a clean recording, or keep using your selected preset.
          </SheetDescription>
        </SheetHeader>
        <ScrollArea className="min-h-0 flex-1 px-6 pb-6">
          <div className="flex flex-col gap-6">
            <ReferenceAttachment reference={snapshot.reference} />
            <p className="text-xs leading-relaxed text-muted-foreground">
              An attached reference overrides the selected voice until cleared. Use 6+ seconds;
              saved presets keep up to 40 seconds. Later audio may be ignored by the model’s
              conditioning window.
            </p>
            <Separator />
            <VoicePresetControls />
            <Separator />
            <div className="flex flex-col gap-3">
              <h3 className="text-sm font-medium">Try the voice</h3>
              <p className="text-sm text-muted-foreground">
                Generate a short sample in the selected language. Uses the current voice, model,
                speed, seed and supported sampling controls.
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
                  playing={
                    snapshot.playback.outputId === snapshot.preview.id && snapshot.playback.playing
                  }
                  position={
                    snapshot.playback.outputId === snapshot.preview.id
                      ? snapshot.playback.position
                      : 0
                  }
                />
              )}
            </div>
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  )
}
