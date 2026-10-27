import { useState } from 'react'
import { Download, FileText, Files, FolderOpen, Layers3, Square, Upload, X } from 'lucide-react'
import { Link } from 'react-router'
import { ScreenFrame, ScreenLoading, DetailValue } from '@/components/studio/screen-frame'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Field, FieldDescription, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Textarea } from '@/components/ui/textarea'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty'
import { Separator } from '@/components/ui/separator'
import { BooleanField } from '@/components/studio/settings-fields'
import { SettingsInspector } from '@/components/studio/settings-inspector'
import { WindowedList } from '@/components/studio/windowed-list'
import { JobStatus, activePhases } from '@/components/studio/job-status'
import { OutputDetails } from '@/components/studio/output-details'
import { act, editBatchText } from '@/lib/actions'
import { notify } from '@/lib/notify'
import { useStudioStore } from '@/stores/studio-store'
import { resolvedModel, languages } from '../../../../shared/data/catalog'

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
  const { batch, units, settings, job } = snapshot
  const active = activePhases.has(job.phase)
  const batchActive = active && job.kind === 'batch'
  const completed = units.filter((unit) => unit.status === 'complete')
  const failed = units.filter((unit) => unit.status === 'error')
  const model = resolvedModel(settings)
  const selectedOutput = units.some((unit) => unit.outputId === inspectOutput)
    ? snapshot.outputs.find((output) => output.id === inspectOutput)
    : undefined
  const effectiveVoice =
    snapshot.reference.status === 'ready'
      ? snapshot.reference.name
      : (snapshot.voices.find((voice) => voice.id === settings.voice)?.label ?? 'Unavailable')
  return (
    <ScreenFrame
      title="Batch"
      description="Turn script files or a chaptered script into separate narrations."
      actions={
        <Button
          variant="outline"
          size="sm"
          onClick={() => act('Open output folder', { type: 'folder.open' })}
        >
          <FolderOpen data-icon="inline-start" aria-hidden="true" />
          Output folder
        </Button>
      }
    >
      <div className="flex min-w-0 flex-col gap-8 xl:flex-row">
        <section aria-label="Batch sources" className="flex min-w-0 flex-1 flex-col gap-5">
          <ToggleGroup
            type="single"
            variant="outline"
            value={batch.source}
            disabled={active}
            aria-label="Batch source"
            onValueChange={(value) => {
              if (value === 'files' || value === 'text')
                void act('Change batch source', { type: 'batch.source', source: value })
            }}
          >
            <ToggleGroupItem value="files">
              <Files aria-hidden="true" />
              Script files
            </ToggleGroupItem>
            <ToggleGroupItem value="text">
              <FileText aria-hidden="true" />
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
                  <Upload data-icon="inline-start" aria-hidden="true" />
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
                      <FileText
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
                          act('Remove batch script', { type: 'batch.remove-file', id: file.id })
                        }
                      >
                        <X aria-hidden="true" />
                      </Button>
                    </div>
                  )}
                />
              ) : (
                <Empty>
                  <EmptyHeader>
                    <EmptyMedia variant="icon">
                      <Files aria-hidden="true" />
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
            <BatchText
              key={`${snapshot.scenario}:${snapshot.documentRevision}`}
              initial={batch.text}
              disabled={active}
            />
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
            <Layers3 data-icon="inline-start" aria-hidden="true" />
            Review items
          </Button>
        </section>
        <aside
          className="flex min-w-0 flex-col gap-5 xl:w-80 xl:shrink-0"
          aria-label="Shared batch settings"
        >
          <h2 className="text-base font-semibold">Shared narration settings</h2>
          <p className="text-sm text-muted-foreground">
            Every item uses the same voice, model, cleanup and export settings.
          </p>
          <dl className="grid grid-cols-2 gap-5">
            <DetailValue label="Voice">{effectiveVoice}</DetailValue>
            <DetailValue label="Model">
              {settings.model === 'auto' ? 'Auto' : model.label}
            </DetailValue>
            <DetailValue label="Language">
              {settings.auto_detect
                ? 'Detected per item'
                : languages.find((language) => language.code === settings.language)?.label}
            </DetailValue>
            <DetailValue label="Output">
              {settings.format.toUpperCase()} · {settings.speed}×
            </DetailValue>
          </dl>
          <SettingsInspector />
          <Button variant="link" size="sm" className="self-start" asChild>
            <Link to="/narrate" onClick={() => notify('Change shared narration settings clicked')}>
              Change voice, language and output
            </Link>
          </Button>
          <p className="text-xs text-muted-foreground">
            No per-chapter overrides. Auto-detection applies separately to each item.
          </p>
        </aside>
      </div>
      <Separator />
      <section aria-labelledby="batch-plan-heading" className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h2 id="batch-plan-heading" className="text-base font-semibold">
            {completed.length || failed.length ? 'Batch results' : 'Items to generate'}
          </h2>
          <div className="flex items-center gap-2">
            <Badge variant="secondary">{units.length} items</Badge>
            {completed.length > 0 && <Badge variant="outline">{completed.length} finished</Badge>}
            {failed.length > 0 && <Badge variant="destructive">{failed.length} failed</Badge>}
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
          <Alert variant="destructive">
            <AlertTitle>
              {completed.length ? 'Some items need attention' : 'No batch items finished.'}
            </AlertTitle>
            <AlertDescription>
              {failed.slice(0, 3).map((unit) => (
                <p key={unit.id}>
                  {unit.title}: {unit.message}
                </p>
              ))}
              {failed.length > 3 && (
                <p>{failed.length - 3} more errors are listed with their items.</p>
              )}
            </AlertDescription>
          </Alert>
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
                act('Save completed batch', { type: 'output.export', id: 'batch', format: 'zip' })
              }
            >
              <Download data-icon="inline-start" aria-hidden="true" />
              Save completed items
            </Button>
            {batchActive ? (
              <Button
                variant="outline"
                disabled={job.phase === 'stopping'}
                onClick={() => act('Stop batch', { type: 'job.cancel' })}
              >
                <Square data-icon="inline-start" aria-hidden="true" />
                {job.phase === 'stopping' ? 'Stopping…' : 'Stop batch'}
              </Button>
            ) : (
              <Button
                disabled={active || !batch.reviewed || !units.length}
                onClick={() => act('Generate batch', { type: 'batch.start' })}
              >
                <Layers3 data-icon="inline-start" aria-hidden="true" />
                Generate batch
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
