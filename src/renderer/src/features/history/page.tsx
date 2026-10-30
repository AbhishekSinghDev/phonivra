import { useState } from 'react'
import { Link } from 'react-router'
import { notify } from '@/lib/notify'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  FileAudioIcon,
  FolderOpenIcon,
  RefreshCwIcon,
  ShieldCheckIcon
} from '@hugeicons/core-free-icons'
import { Input } from '@/components/ui/input'
import { Field, FieldLabel } from '@/components/ui/field'
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
import { Separator } from '@/components/ui/separator'
import { ScreenFrame, ScreenLoading } from '@/components/studio/screen-frame'
import { WindowedList } from '@/components/studio/windowed-list'
import { OutputDetails } from '@/components/studio/output-details'
import { formatTime } from '@/components/studio/job-status'
import { act } from '@/lib/actions'
import { useStudioStore } from '@/stores/studio-store'

export function HistoryPage(): React.JSX.Element {
  const snapshot = useStudioStore((state) => state.snapshot)
  const [query, setQuery] = useState('')
  if (!snapshot) return <ScreenLoading />
  const filtered = snapshot.outputs.filter((output) =>
    output.title.toLowerCase().includes(query.trim().toLowerCase())
  )
  const selected = filtered.find((output) => output.id === snapshot.selectedOutput) ?? filtered[0]
  const watermark = snapshot.watermark?.outputId === selected?.id ? snapshot.watermark : null
  return (
    <ScreenFrame
      title="Audio library"
      description={
        <>
          Keep your <span className="highlight">Best takes close.</span> Listen, export and pick up
          where you left off.
        </>
      }
    >
      <div aria-label="Library actions" className="flex flex-wrap justify-end gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => act('Refresh library', { type: 'outputs.refresh' })}
        >
          <HugeiconsIcon icon={RefreshCwIcon} data-icon="inline-start" aria-hidden="true" />
          Refresh
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => act('Open output folder', { type: 'folder.open' })}
        >
          <HugeiconsIcon icon={FolderOpenIcon} data-icon="inline-start" aria-hidden="true" />
          Open folder
        </Button>
      </div>
      {!snapshot.outputs.length ? (
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <HugeiconsIcon icon={FileAudioIcon} aria-hidden="true" />
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
        <div className="flex min-w-0 flex-col gap-6 lg:flex-row">
          <section
            aria-label="Saved narrations"
            className="flex min-w-0 flex-col gap-4 lg:w-72 lg:shrink-0"
          >
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-sm font-semibold">Saved narrations</h2>
              <span className="text-xs text-muted-foreground">{snapshot.outputs.length} files</span>
            </div>
            <Field>
              <FieldLabel className="sr-only" htmlFor="library-search">
                Search narrations
              </FieldLabel>
              <Input
                id="library-search"
                className="h-11 rounded-xl bg-card"
                placeholder="Search your audio…"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
            </Field>
            {filtered.length ? (
              <WindowedList
                items={filtered}
                itemKey={(output) => output.id}
                label="Saved narrations"
                rowHeight={64}
                renderItem={(output) => (
                  <Button
                    variant={selected?.id === output.id ? 'secondary' : 'ghost'}
                    aria-pressed={selected?.id === output.id}
                    className="h-full w-full justify-start gap-3 rounded-xl px-4"
                    onClick={() =>
                      act('Select narration', { type: 'output.select', id: output.id })
                    }
                  >
                    <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-secondary text-secondary-foreground">
                      <HugeiconsIcon icon={FileAudioIcon} className="size-5" aria-hidden="true" />
                    </span>
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
            ) : (
              <Empty>
                <EmptyHeader>
                  <EmptyTitle>No matching audio</EmptyTitle>
                  <EmptyDescription>Try another title or clear your search.</EmptyDescription>
                </EmptyHeader>
                <EmptyContent>
                  <Button variant="outline" size="sm" onClick={() => setQuery('')}>
                    Clear search
                  </Button>
                </EmptyContent>
              </Empty>
            )}
            <p className="text-xs leading-relaxed text-muted-foreground">
              The audio and SRT, VTT, TXT and JSON companions are managed together when deleting a
              narration.
            </p>
          </section>
          <section
            aria-label="Selected narration"
            className="flex min-w-0 flex-1 flex-col gap-6 card-chai p-6"
          >
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
                    <HugeiconsIcon
                      icon={ShieldCheckIcon}
                      className="size-4 text-muted-foreground"
                      aria-hidden="true"
                    />
                    <h3 className="text-sm font-medium">Perth watermark</h3>
                  </div>
                  {watermark ? (
                    <div role="status" className="flex flex-col gap-1 text-sm">
                      <p className="font-medium">
                        {watermark.state === 'detected'
                          ? 'Watermark detected'
                          : watermark.state === 'not-detected'
                            ? 'Watermark not detected'
                            : 'Watermark check unavailable'}
                      </p>
                      <p className="text-muted-foreground">{watermark.message}</p>
                    </div>
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
                    <HugeiconsIcon icon={FileAudioIcon} aria-hidden="true" />
                  </EmptyMedia>
                  <EmptyTitle>
                    {filtered.length
                      ? 'Select a saved narration.'
                      : 'No matching narration selected'}
                  </EmptyTitle>
                  <EmptyDescription>
                    {filtered.length
                      ? 'Choose a file to load its audio, exports and details.'
                      : 'Clear your search to browse your saved audio.'}
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
