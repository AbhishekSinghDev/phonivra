import { HugeiconsIcon } from '@hugeicons/react'
import { AlertCircleIcon } from '@hugeicons/core-free-icons'
import { useStudioStore } from '@/stores/studio-store'
import { resolvedModel } from '../../../../../shared/data/catalog'

export function NarrationNotices(): React.JSX.Element | null {
  const settings = useStudioStore((state) => state.snapshot?.settings)
  const reference = useStudioStore((state) => state.snapshot?.reference)
  const dependencies = useStudioStore((state) => state.snapshot?.dependencies)
  const voices = useStudioStore((state) => state.snapshot?.voices)
  const script = useStudioStore((state) => state.snapshot?.script ?? '')
  if (!settings || !reference || !dependencies) return null
  const model = resolvedModel(settings)
  const requiresFFmpeg =
    settings.format !== 'wav' || settings.sample_rate !== 24000 || settings.speed !== 1
  return (
    <div className="flex flex-col gap-3">
      {model.id === 'indicf5' &&
        (reference.status !== 'empty' ||
          !voices?.find(({ id }) => id === settings.voice)?.hasTranscript) && (
          <p className="text-sm leading-relaxed text-muted-foreground">
            Select a saved voice preset with a transcript. Use a recording with 5 to 12 seconds of
            speech.
          </p>
        )}
      {!dependencies.ffmpeg && requiresFFmpeg && (
        <div role="alert" className="flex flex-col gap-1 text-sm text-destructive">
          <HugeiconsIcon icon={AlertCircleIcon} aria-hidden="true" />
          <p className="font-medium">FFmpeg unavailable</p>
          <div className="leading-relaxed">
            Choose WAV at 24 kHz and 1× speed, or restore FFmpeg to use other formats, sample rates,
            and speeds.
          </div>
        </div>
      )}
      {!model.reactions &&
        /\[(laugh|chuckle|cough|sigh|gasp|groan|sniff|shush|clear throat)\]/iu.test(script) && (
          <p className="text-sm leading-relaxed text-muted-foreground">
            Remove reaction tags or choose Chatterbox Turbo and English. Other models may read the
            tags aloud.
          </p>
        )}
      {settings.convert_numbers && settings.language !== 'en' && settings.language !== 'hi' && (
        <p className="text-sm leading-relaxed text-muted-foreground">
          Numbers will stay unchanged. Number conversion is available for English and Hindi only.
        </p>
      )}
    </div>
  )
}
