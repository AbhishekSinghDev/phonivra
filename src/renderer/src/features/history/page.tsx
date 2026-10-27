import { Link } from 'react-router'
import { notify } from '@/lib/notify'
import { FileAudio, FolderOpen, RefreshCw, ShieldCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle
} from '@/components/ui/empty'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'
import { ScreenFrame, ScreenLoading } from '@/components/studio/screen-frame'
import { WindowedList } from '@/components/studio/windowed-list'
import { OutputDetails } from '@/components/studio/output-details'
import { formatTime } from '@/components/studio/job-status'
import { act } from '@/lib/actions'
import { useStudioStore } from '@/stores/studio-store'

export function HistoryPage(): React.JSX.Element {
  const snapshot = useStudioStore((state) => state.snapshot)
  if (!snapshot) return <ScreenLoading />
  const selected = snapshot.outputs.find((output) => output.id === snapshot.selectedOutput)
  const watermark = snapshot.watermark?.outputId === selected?.id ? snapshot.watermark : null
  return (
    <ScreenFrame
      title="Library"
      description="Listen to saved narrations and export their audio and companion files."
      actions={
        <>
          <Button
            variant="outline"
            size="sm"
            onClick={() => act('Refresh library', { type: 'outputs.refresh' })}
          >
            <RefreshCw data-icon="inline-start" aria-hidden="true" />
            Refresh
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => act('Open output folder', { type: 'folder.open' })}
          >
            <FolderOpen data-icon="inline-start" aria-hidden="true" />
            Open folder
          </Button>
        </>
      }
    >
      {!snapshot.outputs.length ? (
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <FileAudio aria-hidden="true" />
            </EmptyMedia>
            <EmptyTitle>No saved narrations yet.</EmptyTitle>
            <EmptyDescription>
              Create a narration to keep its audio, subtitles, transcript and metadata here.
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button variant="outline" asChild>
              <Link to="/narrate" onClick={() => notify('Create narration clicked')}>
                Create a narration
              </Link>
            </Button>
          </EmptyContent>
        </Empty>
      ) : (
        <div className="flex min-w-0 flex-col gap-8 xl:flex-row">
          <section
            aria-label="Saved narrations"
            className="flex min-w-0 flex-col gap-4 xl:w-80 xl:shrink-0"
          >
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-sm font-semibold">Saved narrations</h2>
              <span className="text-xs text-muted-foreground">{snapshot.outputs.length} files</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Newest first. Refresh after changes in the output folder.
            </p>
            <WindowedList
              items={snapshot.outputs}
              itemKey={(output) => output.id}
              label="Saved narrations"
              rowHeight={88}
              renderItem={(output) => (
                <Button
                  variant={selected?.id === output.id ? 'secondary' : 'ghost'}
                  className="h-full w-full justify-start"
                  onClick={() => act('Select narration', { type: 'output.select', id: output.id })}
                >
                  <FileAudio data-icon="inline-start" aria-hidden="true" />
                  <span className="flex min-w-0 flex-1 flex-col items-start gap-1">
                    <span className="w-full truncate text-left">{output.title}</span>
                    <span className="text-xs text-muted-foreground">
                      {formatTime(output.duration)} · {output.format.toUpperCase()}
                      {output.external ? ' · external audio' : ''}
                    </span>
                  </span>
                </Button>
              )}
            />
            <p className="text-xs leading-relaxed text-muted-foreground">
              The audio and SRT, VTT, TXT and JSON companions are managed together when deleting a
              narration.
            </p>
          </section>
          <section aria-label="Selected narration" className="flex min-w-0 flex-1 flex-col gap-6">
            {selected ? (
              <>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <h2 className="break-words text-lg font-semibold">{selected.title}</h2>
                  {selected.external && <Badge variant="outline">External audio</Badge>}
                </div>
                <OutputDetails output={selected} playback={snapshot.playback} />
                <Separator />
                <section aria-label="Watermark result" className="flex flex-col gap-3">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="size-4 text-muted-foreground" aria-hidden="true" />
                    <h3 className="text-sm font-medium">Perth watermark</h3>
                  </div>
                  {watermark ? (
                    <Alert
                      variant={
                        watermark.state === 'error' || watermark.state === 'unavailable'
                          ? 'destructive'
                          : 'default'
                      }
                    >
                      <AlertTitle>
                        {watermark.state === 'detected'
                          ? 'Watermark detected'
                          : watermark.state === 'not-detected'
                            ? 'Watermark not detected'
                            : 'Watermark check unavailable'}
                      </AlertTitle>
                      <AlertDescription>{watermark.message}</AlertDescription>
                    </Alert>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      Use Verify watermark to check the selected file. A label in generation
                      metadata is not a detection result.
                    </p>
                  )}
                  <p className="text-xs leading-relaxed text-muted-foreground">
                    Heavy editing or re-encoding can weaken detection. Results below 0.5 are
                    reported as not detected; a missing result does not establish the file’s origin.
                  </p>
                </section>
              </>
            ) : (
              <Empty>
                <EmptyHeader>
                  <EmptyMedia variant="icon">
                    <FileAudio aria-hidden="true" />
                  </EmptyMedia>
                  <EmptyTitle>Select a saved narration.</EmptyTitle>
                  <EmptyDescription>
                    Choose a file to load its audio, exports and details.
                  </EmptyDescription>
                </EmptyHeader>
              </Empty>
            )}
          </section>
        </div>
      )}
    </ScreenFrame>
  )
}
