import { useState } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  ArrowUpRightIcon,
  DownloadIcon,
  FileTextIcon,
  FilesIcon,
  FolderOpenIcon,
  Layers01Icon,
  SquareIcon,
  UploadIcon,
  XIcon
} from '@hugeicons/core-free-icons'
import { ScreenFrame, ScreenLoading } from '@/components/studio/screen-frame'
import { Button } from '@phonivra/ui/components/button'
import { Badge } from '@phonivra/ui/components/badge'
import { Field, FieldDescription, FieldGroup, FieldLabel } from '@phonivra/ui/components/field'
import { Textarea } from '@phonivra/ui/components/textarea'
import { ToggleGroup, ToggleGroupItem } from '@phonivra/ui/components/toggle-group'
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle
} from '@phonivra/ui/components/empty'
import { Separator } from '@phonivra/ui/components/separator'
import { BooleanField, EssentialSettings } from '@/components/studio/settings-fields'
import { SettingsInspector } from '@/components/studio/settings-inspector'
import { VoiceTools } from '@/components/studio/voice-tools'
import { WindowedList } from '@/components/studio/windowed-list'
import { JobStatus, activePhases } from '@/components/studio/job-status'
import { OutputDetails } from '@/components/studio/output-details'
import { act, editBatchText } from '@/lib/actions'
import { notify } from '@/lib/notify'
import { useStudioStore } from '@/stores/studio-store'
import { languages } from '../../../../shared/data/catalog'

function BatchText({
  initial,
  disabled
}: {
  initial: string
  disabled: boolean
}): React.JSX.Element {
  const [draft, setDraft] = useState(initial)
  return (
    <FieldGroup>
      <Field>
        <FieldLabel htmlFor="batch-text">Chaptered script</FieldLabel>
        <Textarea
          id="batch-text"
          variant="script"
          className="h-64 resize-y"
          value={draft}
          disabled={disabled}
          placeholder={
            'An opening paragraph…\n\n# Chapter one\nYour first chapter…\n\n# Chapter two\nYour next chapter…'
          }
          onChange={(event) => {
            setDraft(event.target.value)
            editBatchText(event.target.value)
          }}
          onBlur={() => notify('Edit batch script clicked')}
          aria-describedby="batch-text-help"
        />
        <FieldDescription id="batch-text-help">
          Use #, ## or ### headings for chapter titles. Text before the first heading becomes
          Introduction.
        </FieldDescription>
      </Field>
    </FieldGroup>
  )
}
export default function BatchPage(): React.JSX.Element {
  const snapshot = useStudioStore((state) => state.snapshot)
  const [inspectOutput, setInspectOutput] = useState<string | null>(null)
  if (!snapshot) return <ScreenLoading />
  const { batch, units, job } = snapshot
  const active = activePhases.has(job.phase)
  const batchActive = active && job.kind === 'batch'
  const completed = units.filter((unit) => unit.status === 'complete')
  const failed = units.filter((unit) => unit.status === 'error')
  const selectedOutput = units.some((unit) => unit.outputId === inspectOutput)
    ? snapshot.outputs.find((output) => output.id === inspectOutput)
    : undefined
  return (
    <ScreenFrame
      title="Batch studio"
      description={
        <>
          <span className="highlight">One voice. Every chapter.</span> Turn your scripts into a
          collection of audio files.
        </>
      }
    >
      <div className="flex min-w-0 flex-col gap-6 md:flex-row">
        <section
          aria-label="Batch sources"
          className="flex min-w-0 flex-1 flex-col gap-5 card-chai p-6"
        >
          <ToggleGroup
            type="single"
            variant="outline"
            value={batch.source}
            disabled={active}
            aria-label="Batch source"
            onValueChange={(value) => {
              if (value === 'files' || value === 'text')
                void act('Change batch source', {
                  type: 'batch.source',
                  source: value
                })
            }}
          >
            <ToggleGroupItem value="files">
              <HugeiconsIcon icon={FilesIcon} aria-hidden="true" />
              Script files
            </ToggleGroupItem>
            <ToggleGroupItem value="text">
              <HugeiconsIcon icon={FileTextIcon} aria-hidden="true" />
              Pasted text
            </ToggleGroupItem>
          </ToggleGroup>
          {batch.source === 'files' ? (
            <>
              <div className="flex items-center justify-between gap-4">
                <h2 className="text-sm font-semibold">Script files</h2>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={active}
                  onClick={() => act('Add batch scripts', { type: 'batch.import' })}
                >
                  <HugeiconsIcon icon={UploadIcon} data-icon="inline-start" aria-hidden="true" />
                  Add scripts
                </Button>
              </div>
              {batch.files.length ? (
                <WindowedList
                  items={batch.files}
                  itemKey={(file) => file.id}
                  label="Batch input files"
                  rowHeight={72}
                  renderItem={(file) => (
                    <div className="flex h-full items-center gap-3">
                      <HugeiconsIcon
                        icon={FileTextIcon}
                        className="size-4 shrink-0 text-muted-foreground"
                        aria-hidden="true"
                      />
                      <div className="flex min-w-0 flex-1 flex-col gap-1">
                        <p className="truncate text-sm font-medium">{file.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {file.characters.toLocaleString()} characters
                          {!file.readable && ' · could not read this file'}
                        </p>
                      </div>
                      <Button
                        size="icon-sm"
                        variant="ghost"
                        aria-label={`Remove ${file.name}`}
                        disabled={active}
                        onClick={() =>
                          act('Remove batch script', {
                            type: 'batch.remove-file',
                            id: file.id
                          })
                        }
                      >
                        <HugeiconsIcon icon={XIcon} aria-hidden="true" />
                      </Button>
                    </div>
                  )}
                />
              ) : (
                <Empty>
                  <EmptyHeader>
                    <EmptyMedia variant="icon">
                      <HugeiconsIcon icon={FilesIcon} aria-hidden="true" />
                    </EmptyMedia>
                    <EmptyTitle>Add scripts to start a batch</EmptyTitle>
                    <EmptyDescription>
                      Supported script types: .txt, .md, .markdown, .srt, .vtt.
                    </EmptyDescription>
                  </EmptyHeader>
                </Empty>
              )}
            </>
          ) : (
            <BatchText key={snapshot.documentRevision} initial={batch.text} disabled={active} />
          )}
          <BooleanField
            label="Split into chapters"
            description="Create an output for each Markdown heading. Empty sections are skipped; scripts without headings stay together."
            checked={batch.splitChapters}
            disabled={active}
            onChange={(enabled) =>
              act('Change chapter splitting', { type: 'batch.split', enabled })
            }
          />
          <p className="text-xs text-muted-foreground">
            Only the selected source is used. Files and pasted text keep their own contents when
            switching.
          </p>
          <Button
            variant="outline"
            className="self-start"
            disabled={active}
            onClick={() => act('Review batch items', { type: 'batch.prepare' })}
          >
            <HugeiconsIcon icon={Layers01Icon} data-icon="inline-start" aria-hidden="true" />
            Review items
          </Button>
        </section>
        <aside
          className="card-chai flex min-w-0 flex-col gap-5 p-5 md:w-72 md:shrink-0 xl:w-80"
          aria-label="Shared batch settings"
        >
          <h2 className="text-base font-semibold">Shared narration settings</h2>
          <p className="text-sm text-muted-foreground">
            Every item uses the same voice, model, cleanup and export settings.
          </p>
          <EssentialSettings />
          <VoiceTools />
          <SettingsInspector />
          <p className="text-xs text-muted-foreground">
            No per-chapter overrides. Auto-detection applies separately to each item.
          </p>
        </aside>
      </div>
      <Separator />
      <section aria-labelledby="batch-plan-heading" className="flex flex-col gap-4 card-chai p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h2 id="batch-plan-heading" className="text-base font-semibold">
            {completed.length || failed.length ? 'Batch results' : 'Items to generate'}
          </h2>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary">{units.length} items</Badge>
            {completed.length > 0 && <Badge variant="outline">{completed.length} finished</Badge>}
            {failed.length > 0 && <Badge variant="destructive">{failed.length} failed</Badge>}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => act('Open output folder', { type: 'folder.open' })}
            >
              <HugeiconsIcon icon={FolderOpenIcon} data-icon="inline-start" aria-hidden="true" />
              Output folder
            </Button>
          </div>
        </div>
        {units.length ? (
          <WindowedList
            items={units}
            itemKey={(unit) => unit.id}
            label="Batch units and results"
            rowHeight={96}
            renderItem={(unit, index) => (
              <div className="flex h-full items-center gap-4">
                <span className="w-6 text-xs tabular-nums text-muted-foreground">{index + 1}</span>
                <div className="flex min-w-0 flex-1 flex-col gap-1">
                  <p className="truncate text-sm font-medium">{unit.title}</p>
                  <p className="line-clamp-2 text-xs text-muted-foreground">
                    {unit.message ??
                      `${languages.find((language) => language.code === unit.language)?.label} · shared settings`}
                  </p>
                </div>
                <Badge variant={unit.status === 'error' ? 'destructive' : 'secondary'}>
                  {unit.status}
                </Badge>
                {unit.outputId && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setInspectOutput(unit.outputId!)
                      notify('Inspect batch output clicked')
                    }}
                  >
                    View output
                  </Button>
                )}
              </div>
            )}
          />
        ) : (
          <Empty>
            <EmptyHeader>
              <EmptyTitle>No items reviewed yet</EmptyTitle>
              <EmptyDescription>
                Add scripts or paste text, then review the items before generating.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        )}
        {failed.length > 0 && (
          <div role="alert" className="flex flex-col gap-1 text-sm text-destructive">
            <p className="font-medium">
              {completed.length ? 'Some items need attention' : 'No batch items finished.'}
            </p>
            <div className="leading-relaxed">
              {failed.slice(0, 3).map((unit) => (
                <p key={unit.id}>
                  {unit.title}: {unit.message}
                </p>
              ))}
              {failed.length > 3 && (
                <p>{failed.length - 3} more errors are listed with their items.</p>
              )}
            </div>
          </div>
        )}
        {batchActive || (job.kind === 'batch' && job.phase !== 'idle') ? (
          <JobStatus job={job} />
        ) : null}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <p className="max-w-lg text-xs text-muted-foreground">
            Stopping keeps completed items available. A ZIP contains completed audio and companion
            files.
          </p>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              disabled={!completed.length}
              onClick={() =>
                act('Save completed batch', {
                  type: 'output.export',
                  id: 'batch',
                  format: 'zip'
                })
              }
            >
              <HugeiconsIcon icon={DownloadIcon} data-icon="inline-start" aria-hidden="true" />
              Save completed items
            </Button>
            {batchActive ? (
              <Button
                variant="outline"
                disabled={job.phase === 'stopping'}
                onClick={() => act('Stop batch', { type: 'job.cancel' })}
              >
                <HugeiconsIcon icon={SquareIcon} data-icon="inline-start" aria-hidden="true" />
                {job.phase === 'stopping' ? 'Stopping…' : 'Stop batch'}
              </Button>
            ) : (
              <Button
                className="studio-primary"
                disabled={active || !batch.reviewed || !units.length}
                onClick={() => act('Generate batch', { type: 'batch.start' })}
              >
                Generate batch
                <HugeiconsIcon icon={ArrowUpRightIcon} data-icon="inline-end" aria-hidden="true" />
              </Button>
            )}
          </div>
        </div>
      </section>
      {selectedOutput && (
        <>
          <Separator />
          <section aria-label="Batch output detail" className="flex flex-col gap-4">
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-base font-semibold">{selectedOutput.title}</h2>
              <Button variant="ghost" size="sm" onClick={() => setInspectOutput(null)}>
                Close details
              </Button>
            </div>
            <OutputDetails
              output={selectedOutput}
              playback={snapshot.playback}
              showManagement={false}
              exportVariant="outline"
            />
          </section>
        </>
      )}
      {import.meta.env.DEV && (
        <p className="text-xs text-muted-foreground">
          Mock source files and chapter plans. Real file import, heading-aware preparation and
          completed-result ZIPs need backend work. Markdown splitting is intended to happen before
          cleanup.
        </p>
      )}
    </ScreenFrame>
  )
}
