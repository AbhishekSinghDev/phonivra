import { HugeiconsIcon } from '@hugeicons/react'
import { AlertCircleIcon } from '@hugeicons/core-free-icons'
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
        <div role="alert" className="flex flex-col gap-1 text-sm text-destructive">
          <HugeiconsIcon icon={AlertCircleIcon} aria-hidden="true" />
          <p className="font-medium">Model and language do not match</p>
          <div className="leading-relaxed">
            {model.label} is English-only. Choose Multilingual V3 or Auto for {language?.label}.
          </div>
        </div>
      )}
      {!dependencies.ffmpeg && requiresFFmpeg && (
        <div role="alert" className="flex flex-col gap-1 text-sm text-destructive">
          <HugeiconsIcon icon={AlertCircleIcon} aria-hidden="true" />
          <p className="font-medium">FFmpeg unavailable</p>
          <div className="leading-relaxed">
            ffmpeg is required for this output format or sample rate. Choose WAV at 24 kHz and 1×
            speed, or install FFmpeg.
          </div>
        </div>
      )}
      {!model.reactions &&
        /\[(laugh|chuckle|cough|sigh|gasp|groan|sniff|shush|clear throat)\]/iu.test(script) && (
          <p className="text-sm leading-relaxed text-muted-foreground">
            This model does not support reaction tags. They may be spoken as text; remove them or
            use Turbo or Nano with English.
          </p>
        )}
      {settings.convert_numbers && settings.language !== 'en' && settings.language !== 'hi' && (
        <p className="text-sm leading-relaxed text-muted-foreground">
          Numbers will stay unchanged. Number conversion is available for English and Hindi only.
        </p>
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
