import { AudioLines, ArrowUpRight, Check } from 'lucide-react'
import { Link } from 'react-router'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty'
import { Separator } from '@/components/ui/separator'
import { AudioTransport } from '@/components/studio/audio-transport'
import { OutputDetails } from '@/components/studio/output-details'
import { JobStatus, activePhases } from '@/components/studio/job-status'
import { useStudioStore } from '@/stores/studio-store'
import { notify } from '@/lib/notify'

export function NarrationResult(): React.JSX.Element | null {
  const job = useStudioStore((state) => state.snapshot?.job)
  const outputs = useStudioStore((state) => state.snapshot?.outputs)
  const playback = useStudioStore((state) => state.snapshot?.playback)
  const preview = useStudioStore((state) => state.snapshot?.preview)
  if (!job || !outputs || !playback) return null
  const active = activePhases.has(job.phase)
  const output = outputs[0]
  return (
    <section aria-labelledby="narration-result-heading" className="flex min-w-0 flex-col gap-6">
      <div className="flex items-center justify-between gap-4">
        <h2 id="narration-result-heading" className="text-base font-semibold">
          {active ? 'Generation' : 'Your narration'}
        </h2>
        {!active && output && (
          <Button variant="ghost" size="sm" asChild>
            <Link to="/library" onClick={() => notify('Open library clicked')}>
              View library
              <ArrowUpRight data-icon="inline-end" aria-hidden="true" />
            </Link>
          </Button>
        )}
      </div>
      {job.phase !== 'idle' && <JobStatus job={job} />}
      {job.streaming !== 'unavailable' && active && (
        <AudioTransport
          id={`stream:${job.id}`}
          title="Listen while generating"
          duration={Math.max(1, job.part * 4)}
          position={playback.outputId === `stream:${job.id}` ? playback.position : 0}
          playing={playback.outputId === `stream:${job.id}` && playback.playing}
          state={job.streaming === 'buffering' ? 'loading' : 'provisional'}
        />
      )}
      {job.kind === 'preview' && preview && !active && (
        <>
          <AudioTransport
            id={preview.id}
            title="Voice preview"
            duration={preview.duration}
            playing={playback.outputId === preview.id && playback.playing}
            position={playback.outputId === preview.id ? playback.position : 0}
          />
          <p className="text-xs text-muted-foreground">
            Voice previews do not include subtitles or transcripts and are not added to the Library.
          </p>
        </>
      )}
      {output ? (
        <>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm font-medium">
              {active || job.phase === 'error' || job.phase === 'stopped'
                ? 'Previous take'
                : 'Latest take'}
            </p>
            <Badge variant="outline">
              <Check aria-hidden="true" />
              Saved in Library
            </Badge>
          </div>
          <OutputDetails
            output={output}
            playback={playback}
            showManagement={false}
            exportVariant="outline"
          />
        </>
      ) : (
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <AudioLines aria-hidden="true" />
            </EmptyMedia>
            <EmptyTitle>
              {active ? 'Your narration is taking shape' : 'Ready for your first take'}
            </EmptyTitle>
            <EmptyDescription>
              {active
                ? 'The finished audio and companion files will appear here.'
                : 'Write a script, choose a voice, and generate. Audio, subtitles and a transcript appear here.'}
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      )}
      {active && output && <Separator />}
    </section>
  )
}
