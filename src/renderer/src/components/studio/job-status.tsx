import { Check, CircleAlert, Clock3, Download, Square, Waves } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Spinner } from '@/components/ui/spinner'
import { act } from '@/lib/actions'
import type { JobState } from '../../../../shared/studio'

export const activePhases = new Set([
  'queued',
  'downloading',
  'loading',
  'preparing',
  'generating',
  'mastering',
  'encoding',
  'companions',
  'stopping'
])
export function formatTime(seconds: number): string {
  return `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, '0')}`
}
export function JobStatus({
  job,
  compact = false
}: {
  job: JobState
  compact?: boolean
}): React.JSX.Element {
  const active = activePhases.has(job.phase)
  const Icon =
    job.phase === 'error'
      ? CircleAlert
      : job.phase === 'complete'
        ? Check
        : job.phase === 'downloading'
          ? Download
          : job.phase === 'idle' || job.phase === 'stopped'
            ? Clock3
            : Spinner
  return (
    <section aria-label="Current job" className="flex min-w-0 flex-col gap-4">
      <div className="flex items-start gap-3">
        <Icon className="mt-1 size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <p className="text-sm font-medium">
            {compact
              ? job.phase === 'idle'
                ? 'No active job'
                : job.title
              : job.kind === 'download'
                ? 'Model download'
                : job.title}
          </p>
          <p className="text-sm text-muted-foreground" role="status">
            {job.message}
          </p>
        </div>
        {!compact && (
          <Badge variant={job.phase === 'error' ? 'destructive' : 'secondary'}>{job.phase}</Badge>
        )}
      </div>
      {active && (
        <>
          <Progress value={job.progress} aria-label="Job progress" />
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
            <span className="tabular-nums">
              {Math.round(job.progress)}%
              {job.elapsed > 0 && ` · ${formatTime(job.elapsed)} elapsed`}
            </span>
            <span>
              {job.remaining === null
                ? 'Time estimate starts after loading'
                : `${formatTime(job.remaining)} remaining`}
            </span>
          </div>
        </>
      )}
      {job.streaming === 'ready' && !compact && (
        <Alert>
          <Waves aria-hidden="true" />
          <AlertTitle>Streaming preview available</AlertTitle>
          <AlertDescription>
            Provisional audio. Final mastering and export are still running.
          </AlertDescription>
        </Alert>
      )}
      {active && (
        <Button
          variant="outline"
          size="sm"
          className="self-start"
          disabled={job.phase === 'stopping'}
          onClick={() => act('Stop generation', { type: 'job.cancel' })}
        >
          <Square data-icon="inline-start" aria-hidden="true" />
          {job.phase === 'stopping' ? 'Stopping…' : 'Stop'}
        </Button>
      )}
    </section>
  )
}
