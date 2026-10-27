import { CircleAlert, Info } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { useStudioStore } from '@/stores/studio-store'
import { languages, resolvedModel } from '../../../../../shared/data/catalog'

export function NarrationNotices(): React.JSX.Element | null {
  const settings = useStudioStore((state) => state.snapshot?.settings)
  const reference = useStudioStore((state) => state.snapshot?.reference)
  const dependencies = useStudioStore((state) => state.snapshot?.dependencies)
  const script = useStudioStore((state) => state.snapshot?.script ?? '')
  if (!settings || !reference || !dependencies) return null
  const model = resolvedModel(settings)
  const language = languages.find((item) => item.code === settings.language)
  const compatible = model.languages.includes(settings.language)
  const requiresFFmpeg =
    settings.format !== 'wav' || settings.sample_rate !== 24000 || settings.speed !== 1
  return (
    <div className="flex flex-col gap-3">
      {!compatible && (
        <Alert variant="destructive">
          <CircleAlert aria-hidden="true" />
          <AlertTitle>Model and language do not match</AlertTitle>
          <AlertDescription>
            {model.label} is English-only. Choose Multilingual V3 or Auto for {language?.label}.
          </AlertDescription>
        </Alert>
      )}
      {!dependencies.ffmpeg && requiresFFmpeg && (
        <Alert variant="destructive">
          <CircleAlert aria-hidden="true" />
          <AlertTitle>FFmpeg unavailable</AlertTitle>
          <AlertDescription>
            ffmpeg is required for this output format or sample rate. Choose WAV at 24 kHz and 1×
            speed, or install FFmpeg.
          </AlertDescription>
        </Alert>
      )}
      {!model.reactions &&
        /\[(laugh|chuckle|cough|sigh|gasp|groan|sniff|shush|clear throat)\]/iu.test(script) && (
          <Alert>
            <Info aria-hidden="true" />
            <AlertTitle>This model does not support reaction tags</AlertTitle>
            <AlertDescription>
              Existing reaction tags may be spoken as text. Remove them or use Turbo or Nano with
              English.
            </AlertDescription>
          </Alert>
        )}
      {settings.convert_numbers && settings.language !== 'en' && settings.language !== 'hi' && (
        <Alert>
          <Info aria-hidden="true" />
          <AlertTitle>Numbers will stay unchanged</AlertTitle>
          <AlertDescription>
            Number conversion is available for English and Hindi only.
          </AlertDescription>
        </Alert>
      )}
      {settings.auto_detect && (
        <p className="text-xs leading-relaxed text-muted-foreground">
          Language detection is heuristic and applies to the whole narration. Review the selected
          language for short or mixed-language scripts.
        </p>
      )}
    </div>
  )
}
