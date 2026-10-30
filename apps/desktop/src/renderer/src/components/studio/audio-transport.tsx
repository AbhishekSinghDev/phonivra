import { HugeiconsIcon } from '@hugeicons/react'
import { PauseIcon, PlayIcon, RotateCcwIcon } from '@hugeicons/core-free-icons'
import { Button } from '@phonivra/ui/components/button'
import { AudioPlayer, AudioPlayerPlay, AudioPlayerTime } from '@phonivra/ui/components/audio-player'
import { Waveform } from '@phonivra/ui/components/waveform'
import { useAudioPlayer } from '@phonivra/ui/hooks/use-audio-player'
import { useStudioStore } from '@/stores/studio-store'
import { Badge } from '@phonivra/ui/components/badge'
import { Skeleton } from '@phonivra/ui/components/skeleton'
import { act } from '@/lib/actions'

const illustrativePeaks = Array.from({ length: 160 }, (_, index) => {
  const phrase = Math.abs(Math.sin(index * 0.12))
  return 0.08 + phrase * (0.18 + 0.6 * Math.abs(Math.sin(index * 0.83)))
})

export function AudioTransport({
  id,
  title,
  duration,
  position = 0,
  playing = false,
  state = 'ready'
}: {
  id: string
  title: string
  duration: number
  position?: number
  playing?: boolean
  state?: 'loading' | 'ready' | 'unavailable' | 'provisional'
}): React.JSX.Element {
  const basePlayer = useAudioPlayer()
  const player = {
    ...basePlayer,
    status: state === 'unavailable' ? 'idle' : playing ? 'playing' : 'ready',
    playing,
    duration,
    currentTime: position,
    toggle: () => act(playing ? 'Pause audio' : 'Play audio', { type: 'playback.toggle', id }),
    seek: (seconds: number) => {
      // Action errors are reported by the studio store.
      void act('Seek audio', { type: 'playback.seek', seconds, id })
    },
    time: {
      subscribe: (listener: (time: number) => void) => {
        listener(position)
        return useStudioStore.subscribe((store) => {
          const playback = store.snapshot?.playback
          listener(playback?.outputId === id ? playback.position : 0)
        })
      }
    }
  } satisfies Parameters<typeof AudioPlayer>[0]['player']
  if (state === 'loading')
    return (
      <div aria-label="Loading audio" className="flex items-center gap-4">
        <Skeleton className="size-10" />
        <Skeleton className="h-8 flex-1" />
      </div>
    )
  const disabled = state === 'unavailable'
  return (
    <section
      aria-label={`${title} playback`}
      className="flex flex-col gap-4 rounded-xl bg-muted/50 p-4"
    >
      <div className="flex items-center justify-between gap-4">
        <p className="text-sm font-medium">{title}</p>
        {state === 'provisional' && <Badge variant="outline">Provisional</Badge>}
      </div>
      <AudioPlayer
        player={player}
        shortcuts={false}
        className="flex-nowrap"
        aria-label={`${title} controls`}
      >
        <AudioPlayerPlay disabled={disabled}>
          {playing ? (
            <HugeiconsIcon icon={PauseIcon} aria-hidden="true" />
          ) : (
            <HugeiconsIcon icon={PlayIcon} aria-hidden="true" />
          )}
        </AudioPlayerPlay>
        <Button
          size="icon"
          variant="ghost"
          aria-label="Restart audio"
          disabled={disabled}
          onClick={() => act('Restart audio', { type: 'playback.seek', seconds: 0, id })}
        >
          <HugeiconsIcon icon={RotateCcwIcon} aria-hidden="true" />
        </Button>
        <AudioPlayerTime className="ml-auto" />
        <span className="text-xs text-muted-foreground">/</span>
        <AudioPlayerTime type="duration" />
      </AudioPlayer>
      <Waveform
        aria-label={`${title} illustrative waveform, seek playback`}
        className="h-16"
        peaks={illustrativePeaks}
        duration={duration}
        currentTime={position}
        disabled={disabled}
        onSeekCommitted={(seconds) => {
          // Action errors are reported by the studio store.
          void act('Seek audio', { type: 'playback.seek', seconds, id })
        }}
      />
      <p className="text-xs text-muted-foreground">Illustrative waveform</p>
      {disabled && (
        <p className="text-sm text-muted-foreground">
          Audio will be available when generation finishes.
        </p>
      )}
    </section>
  )
}
