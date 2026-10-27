import { useState } from 'react'
import { Pause, Play, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { act } from '@/lib/actions'
import { formatTime } from './job-status'

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
  const [seeking, setSeeking] = useState<{ id: string; position: number } | null>(null)
  const shownPosition = seeking?.id === id ? seeking.position : position
  if (state === 'loading')
    return (
      <div aria-label="Loading audio" className="flex items-center gap-4">
        <Skeleton className="size-10" />
        <Skeleton className="h-8 flex-1" />
      </div>
    )
  const disabled = state === 'unavailable'
  return (
    <section aria-label={`${title} playback`} className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-4">
        <p className="text-sm font-medium">{title}</p>
        {state === 'provisional' && <Badge variant="outline">Provisional</Badge>}
      </div>
      <div className="flex items-center gap-3">
        <Button
          size="icon"
          aria-label={playing ? 'Pause audio' : 'Play audio'}
          disabled={disabled}
          onClick={() =>
            act(playing ? 'Pause audio' : 'Play audio', { type: 'playback.toggle', id })
          }
        >
          {playing ? <Pause aria-hidden="true" /> : <Play aria-hidden="true" />}
        </Button>
        <Button
          size="icon"
          variant="ghost"
          aria-label="Restart audio"
          disabled={disabled}
          onClick={() => act('Restart audio', { type: 'playback.seek', seconds: 0, id })}
        >
          <RotateCcw aria-hidden="true" />
        </Button>
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <Slider
            aria-label="Playback position"
            value={[shownPosition]}
            min={0}
            max={Math.max(1, duration)}
            step={0.1}
            disabled={disabled}
            onValueChange={(values) => setSeeking({ id, position: values[0] })}
            onValueCommit={(values) => {
              void act('Seek audio', { type: 'playback.seek', seconds: values[0], id }).then(() =>
                setSeeking(null)
              )
            }}
          />
          <div className="flex justify-between text-xs tabular-nums text-muted-foreground">
            <span>{formatTime(shownPosition)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>
      </div>
      {disabled && (
        <p className="text-sm text-muted-foreground">
          Audio will be available when generation finishes.
        </p>
      )}
    </section>
  )
}
