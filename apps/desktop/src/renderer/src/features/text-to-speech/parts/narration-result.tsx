import { HugeiconsIcon } from '@hugeicons/react'
import {
  AudioLinesIcon,
  ArrowUpRightIcon,
  CheckIcon,
  DownloadIcon
} from '@hugeicons/core-free-icons'
import { Link } from 'react-router'
import { Button } from '@phonivra/ui/components/button'
import { Badge } from '@phonivra/ui/components/badge'
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle
} from '@phonivra/ui/components/empty'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@phonivra/ui/components/dialog'
import { ScrollArea } from '@phonivra/ui/components/scroll-area'
import { act } from '@/lib/actions'
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
  const narrationJob = job.kind === 'narration' || job.kind === 'preview'
  const active = narrationJob && activePhases.has(job.phase)
  const output = outputs[0]
  return (
    <section
      aria-labelledby="narration-result-heading"
      className="flex min-w-0 flex-col gap-5 card-chai p-6"
    >
      <div className="flex items-center justify-between gap-4">
        <h2 id="narration-result-heading" className="text-base font-semibold">
          {active ? 'Generation' : 'Latest audio'}
        </h2>
        {!active && output && (
          <Button variant="ghost" size="sm" asChild>
            <Link to="/library" onClick={() => notify('Open library clicked')}>
              View library
              <HugeiconsIcon icon={ArrowUpRightIcon} data-icon="inline-end" aria-hidden="true" />
            </Link>
          </Button>
        )}
      </div>
      {narrationJob && job.phase !== 'idle' && <JobStatus job={job} />}
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
              <HugeiconsIcon icon={CheckIcon} aria-hidden="true" />
              Saved in Library
            </Badge>
          </div>
          <AudioTransport
            id={output.id}
            title={output.title}
            duration={output.duration}
            playing={playback.outputId === output.id && playback.playing}
            position={playback.outputId === output.id ? playback.position : 0}
          />
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="text-xs text-muted-foreground">
              {output.format.toUpperCase()} audio · {output.sampleRate / 1000} kHz
            </span>
            <div className="flex items-center gap-2">
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="ghost" size="sm" onClick={() => notify('Take details clicked')}>
                    Details & exports
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-h-5/6 sm:max-w-3xl">
                  <DialogHeader>
                    <DialogTitle>Take details</DialogTitle>
                    <DialogDescription>
                      Export audio and companion files, or review the settings used.
                    </DialogDescription>
                  </DialogHeader>
                  <ScrollArea className="min-h-0 flex-1 pr-4">
                    <OutputDetails
                      output={output}
                      playback={playback}
                      showManagement={false}
                      exportVariant="outline"
                    />
                  </ScrollArea>
                </DialogContent>
              </Dialog>
              <Button
                variant="secondary"
                size="sm"
                onClick={() =>
                  act('Save audio', { type: 'output.export', id: output.id, format: 'audio' })
                }
              >
                <HugeiconsIcon icon={DownloadIcon} data-icon="inline-start" aria-hidden="true" />
                Save audio
              </Button>
            </div>
          </div>
        </>
      ) : (
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <HugeiconsIcon icon={AudioLinesIcon} aria-hidden="true" />
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
    </section>
  )
}
