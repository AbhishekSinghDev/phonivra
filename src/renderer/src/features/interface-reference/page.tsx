import { useId, useState } from 'react'
import {
  AudioLines,
  Check,
  CircleAlert,
  Download,
  FileAudio,
  FileText,
  FolderOpen,
  RefreshCw,
  SlidersHorizontal
} from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle
} from '@/components/ui/empty'
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { Spinner } from '@/components/ui/spinner'
import { Progress } from '@/components/ui/progress'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table'
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemMedia,
  ItemTitle
} from '@/components/ui/item'
import { AudioTransport } from '@/components/studio/audio-transport'
import { ReferenceAttachment } from '@/components/studio/reference-attachment'
import {
  EssentialSettings,
  AdvancedSettings,
  BooleanField
} from '@/components/studio/settings-fields'
import { JobStatus } from '@/components/studio/job-status'
import { OutputDetails } from '@/components/studio/output-details'
import { SettingsInspector } from '@/components/studio/settings-inspector'
import { WindowedList } from '@/components/studio/windowed-list'
import { ConfirmDelete } from '@/components/studio/confirm-delete'
import { ScriptEditor } from '@/components/studio/script-editor'
import { VoicePresetControls } from '@/components/studio/voice-preset-controls'
import { ScenarioControls } from './scenario-controls'
import { act, reviewActions, updateSettings } from '@/lib/actions'
import { notify } from '@/lib/notify'
import { useStudioStore } from '@/stores/studio-store'
import { models, languages, reactionTags, resolvedModel } from '../../../../shared/data/catalog'
import { fixtures } from '../../../../shared/data/fixtures'
import { inventoryMessages } from '../../../../shared/data/inventory-fixtures'
import type { JobPhase } from '../../../../shared/studio'

function SectionHeading({
  title,
  description
}: {
  title: string
  description?: string
}): React.JSX.Element {
  return (
    <div className="flex flex-col gap-1">
      <h2 className="text-base font-semibold">{title}</h2>
      {description && <p className="text-sm text-muted-foreground">{description}</p>}
    </div>
  )
}
function WorkspaceSpecimen(): React.JSX.Element | null {
  const snapshot = useStudioStore((s) => s.snapshot)
  if (!snapshot) return null
  const output = snapshot.outputs.find((o) => o.id === snapshot.selectedOutput)
  return (
    <div className="grid min-w-0 gap-8 xl:grid-cols-2">
      <section className="flex min-w-0 flex-col gap-6">
        <SectionHeading
          title="Narration controls"
          description="Shared essentials, advanced settings and reference audio."
        />
        <ScriptEditor />
        <Separator />
        <EssentialSettings />
        <Separator />
        <ReferenceAttachment reference={snapshot.reference} />
        <VoicePresetControls />
        <SettingsInspector />
        <Separator />
        <AdvancedSettings />
      </section>
      <section className="flex min-w-0 flex-col gap-6">
        <SectionHeading
          title="Generation and output"
          description="One job and its resulting audio bundle."
        />
        <JobStatus job={snapshot.job} />
        <div className="flex flex-wrap gap-2">
          <Button
            onClick={() => act('Generate narration', { type: 'job.start', kind: 'narration' })}
          >
            <AudioLines data-icon="inline-start" aria-hidden="true" />
            Generate narration
          </Button>
          <Button
            variant="outline"
            onClick={() => act('Generate preview', { type: 'job.start', kind: 'preview' })}
          >
            Voice preview
          </Button>
        </div>
        <Separator />
        {output ? (
          <OutputDetails output={output} playback={snapshot.playback} />
        ) : (
          <Empty>
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <FileAudio aria-hidden="true" />
              </EmptyMedia>
              <EmptyTitle>No saved narrations yet.</EmptyTitle>
              <EmptyDescription>Write a script and generate your first narration.</EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
              <Button
                variant="outline"
                onClick={() => act('Generate narration', { type: 'job.start', kind: 'narration' })}
              >
                Generate narration
              </Button>
            </EmptyContent>
          </Empty>
        )}
        <Separator />
        <SectionHeading title="Pronunciation dictionary" />
        <DictionarySpecimen />
      </section>
    </div>
  )
}
function DictionarySpecimen(): React.JSX.Element {
  const dictionary = useStudioStore((s) => s.snapshot?.dictionary ?? '')
  const [draft, setDraft] = useState<string | null>(null)
  const id = useId()
  return (
    <FieldGroup>
      <Field>
        <FieldLabel htmlFor={id}>Pronunciation rules</FieldLabel>
        <Textarea
          id={id}
          value={draft ?? dictionary}
          rows={4}
          onChange={(event) => setDraft(event.target.value)}
          aria-describedby={`${id}-hint`}
        />
        <FieldDescription id={`${id}-hint`}>
          One rule per line: Phonivra =&gt; fo-nee-vra. Supports =, =&gt;, and -&gt;; # starts a
          comment.
        </FieldDescription>
      </Field>
      <Button
        variant="outline"
        size="sm"
        className="self-start"
        onClick={() =>
          act('Save dictionary', { type: 'dictionary.save', text: draft ?? dictionary })
        }
      >
        Save dictionary
      </Button>
    </FieldGroup>
  )
}
function StateSpecimens(): React.JSX.Element | null {
  const snapshot = useStudioStore((s) => s.snapshot)
  if (!snapshot) return null
  const phases: readonly JobPhase[] = [
    'idle',
    'queued',
    'downloading',
    'loading',
    'preparing',
    'generating',
    'mastering',
    'encoding',
    'companions',
    'stopping',
    'stopped',
    'error',
    'complete'
  ]
  return (
    <div className="flex flex-col gap-8">
      <SectionHeading
        title="Shared state specimens"
        description="Use the scenario panel to inspect a complete state, or compare the examples below."
      />
      <div className="flex flex-wrap gap-2">
        {phases.map((phase) => (
          <Badge
            key={phase}
            variant={
              phase === 'error' ? 'destructive' : phase === 'complete' ? 'default' : 'secondary'
            }
          >
            {phase}
          </Badge>
        ))}
      </div>
      <div className="grid gap-8 xl:grid-cols-2">
        <section className="flex flex-col gap-6">
          <SectionHeading title="Action states" />
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => notify('Primary action clicked')}>Primary action</Button>
            <Button variant="outline" onClick={() => notify('Secondary action clicked')}>
              Secondary action
            </Button>
            <Button variant="ghost" onClick={() => notify('Quiet action clicked')}>
              Quiet action
            </Button>
            <Button disabled>Unavailable</Button>
            <Button disabled>
              <Spinner data-icon="inline-start" />
              Generating…
            </Button>
          </div>
          <ConfirmDelete
            name="example narration"
            description="This specimen demonstrates an explicit destructive confirmation."
            onConfirm={() => notify('Delete example clicked')}
          />
          <Separator />
          <SectionHeading title="Field states" />
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="specimen-title">Title</FieldLabel>
              <Input
                id="specimen-title"
                value={snapshot.settings.title}
                maxLength={120}
                onChange={(event) => updateSettings('title', event.target.value)}
              />
              <FieldDescription>
                120 characters. Output filenames use a shortened version.
              </FieldDescription>
            </Field>
            <Field data-invalid>
              <FieldLabel htmlFor="specimen-invalid">Reference duration</FieldLabel>
              <Input
                id="specimen-invalid"
                value="3.2 seconds"
                readOnly
                aria-invalid
                aria-describedby="specimen-error"
              />
              <FieldError id="specimen-error">
                The reference recording is 3.2s; Chatterbox needs at least 5 seconds (6+
                recommended).
              </FieldError>
            </Field>
            <Field data-disabled>
              <FieldLabel htmlFor="specimen-disabled">Top-k for Multilingual</FieldLabel>
              <Input id="specimen-disabled" value="Unsupported by this model" disabled />
              <FieldDescription>Normally omitted from the settings form.</FieldDescription>
            </Field>
            <BooleanField
              label="Normalize loudness"
              description="Demonstrates an enabled setting."
              checked={snapshot.settings.loudness}
              onChange={(value) => updateSettings('loudness', value)}
            />
            <BooleanField
              label="Unsupported option"
              description="A reason stays visible when a setting is unavailable."
              checked={false}
              disabled
              onChange={() => undefined}
            />
          </FieldGroup>
        </section>
        <section className="flex flex-col gap-6">
          <SectionHeading title="Feedback" />
          <Alert>
            <Check aria-hidden="true" />
            <AlertTitle>Narration ready</AlertTitle>
            <AlertDescription>
              Audio, subtitles, transcript and metadata are available.
            </AlertDescription>
          </Alert>
          <Alert variant="destructive">
            <CircleAlert aria-hidden="true" />
            <AlertTitle>Generation could not finish</AlertTitle>
            <AlertDescription>
              Could not generate audio: The GPU ran out of memory.
            </AlertDescription>
          </Alert>
          <Progress value={42} aria-label="Example progress: 42 percent" />
          <div aria-label="Loading content" className="flex flex-col gap-3">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
          <Separator />
          <SectionHeading title="Audio states" />
          <AudioTransport id="specimen" title="Loading audio" duration={0} state="loading" />
          <AudioTransport id="specimen" title="Audio not ready" duration={0} state="unavailable" />
          <AudioTransport id="take-1" title="Streaming preview" duration={28} state="provisional" />
          <Separator />
          <Empty>
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <FolderOpen aria-hidden="true" />
              </EmptyMedia>
              <EmptyTitle>Select a saved narration.</EmptyTitle>
              <EmptyDescription>Its audio and companion files will appear here.</EmptyDescription>
            </EmptyHeader>
          </Empty>
        </section>
      </div>
      <Separator />
      <SectionHeading
        title="All inventory edge cases"
        description="Legacy descriptions identify defects for review; they do not define the intended default behavior."
      />
      <WindowedList
        items={fixtures}
        label="Inventory state scenarios"
        itemKey={(fixture) => fixture.id}
        rowHeight={80}
        renderItem={(fixture) => (
          <Button
            variant="ghost"
            className="h-full w-full justify-start whitespace-normal text-left"
            onClick={() => reviewActions.scenario(fixture.id)}
          >
            <span className="flex min-w-0 flex-1 flex-col gap-1">
              <span className="line-clamp-1">{fixture.label}</span>
              <span className="line-clamp-1 text-xs text-muted-foreground">
                {fixture.description}
              </span>
            </span>
            <Badge variant="outline">{fixture.section}</Badge>
          </Button>
        )}
      />
    </div>
  )
}
function CatalogSpecimens(): React.JSX.Element | null {
  const snapshot = useStudioStore((s) => s.snapshot)
  if (!snapshot) return null
  const model = resolvedModel(snapshot.settings)
  return (
    <div className="flex flex-col gap-8">
      <SectionHeading
        title="Model capabilities"
        description="Controls and compatibility come from the model catalog."
      />
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Model</TableHead>
            <TableHead>Languages</TableHead>
            <TableHead>Reactions</TableHead>
            <TableHead>Parameters</TableHead>
            <TableHead>Availability</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {models.map((item) => (
            <TableRow key={item.id}>
              <TableCell className="font-medium">{item.label}</TableCell>
              <TableCell>{item.languages.length === 1 ? 'English' : 'All 23'}</TableCell>
              <TableCell>
                {item.id === 'auto'
                  ? 'Resolved model'
                  : item.reactions
                    ? 'Supported'
                    : 'Unsupported'}
              </TableCell>
              <TableCell>{item.parameters}</TableCell>
              <TableCell>
                {item.downloadable
                  ? snapshot.models.find((m) => m.id === item.id)?.status
                  : 'Router'}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <Alert>
        <Download aria-hidden="true" />
        <AlertTitle>Model management and streaming</AlertTitle>
        <AlertDescription>
          New, needs backend work. Download sizes, progress and lifecycle actions are simulated.
        </AlertDescription>
      </Alert>
      <ItemGroup>
        {snapshot.models.map((item) => (
          <Item key={item.id} variant="outline">
            <ItemMedia>
              <Download aria-hidden="true" />
            </ItemMedia>
            <ItemContent>
              <ItemTitle>{models.find((m) => m.id === item.id)?.label}</ItemTitle>
              <ItemDescription>
                {item.status} ·{' '}
                {item.bytes === null
                  ? 'Download size not known'
                  : `${(item.bytes / 1000000000).toFixed(2)} GB (mock)`}
              </ItemDescription>
              {item.status === 'downloading' && (
                <Progress value={item.progress} aria-label="Download progress" />
              )}
            </ItemContent>
            <ItemActions>
              {item.status === 'not-installed' ? (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => act('Download model', { type: 'model.download', id: item.id })}
                >
                  Download
                </Button>
              ) : (
                <ConfirmDelete
                  name={models.find((m) => m.id === item.id)?.label ?? item.id}
                  description="The cached model files will be removed. Existing narration audio is kept."
                  onConfirm={() =>
                    act('Remove model', { type: 'model.remove', id: item.id, confirmed: true })
                  }
                />
              )}
            </ItemActions>
          </Item>
        ))}
      </ItemGroup>
      <Separator />
      <SectionHeading
        title="Voice sources"
        description="Presets, discovered recordings, and custom voices remain distinct."
      />
      <WindowedList
        items={snapshot.voices}
        itemKey={(voice) => voice.id}
        label="Voice catalog"
        renderItem={(voice) => (
          <div className="flex h-full items-center justify-between gap-4">
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{voice.label}</p>
              <p className="text-xs text-muted-foreground">
                {voice.kind} ·{' '}
                {voice.previewAvailable ? 'Preview available' : 'Audition uses reference'}
              </p>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                updateSettings('voice', voice.id)
                act('Audition voice', { type: 'playback.toggle', id: voice.id })
              }}
            >
              Audition
            </Button>
          </div>
        )}
      />
      <SectionHeading
        title="Native reactions"
        description={`Current resolved model: ${model.label}.`}
      />
      <div className="flex flex-wrap gap-2">
        {reactionTags.map((tag) => (
          <Button
            key={tag}
            variant="outline"
            size="sm"
            disabled={!model.reactions}
            onClick={() =>
              act('Insert reaction', { type: 'script.update', text: `${snapshot.script} [${tag}]` })
            }
          >
            [{tag}]
          </Button>
        ))}
      </div>
      <SectionHeading
        title="Languages"
        description="All 23 languages include their native label. Selecting a language does not translate."
      />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {languages.map((language) => (
          <div key={language.code} className="flex flex-col gap-1">
            <p className="text-sm font-medium">
              {language.label}{' '}
              <span className="font-normal text-muted-foreground" lang={language.code}>
                {language.nativeLabel}
              </span>
            </p>
            {language.note && (
              <p className="text-xs leading-relaxed text-muted-foreground">{language.note}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
function MessageSpecimens(): React.JSX.Element {
  const [query, setQuery] = useState('')
  const filtered = inventoryMessages.filter((message) =>
    message.message.toLowerCase().includes(query.toLowerCase())
  )
  return (
    <div className="flex flex-col gap-6">
      <SectionHeading
        title="Exact inventory messages"
        description="Legacy names and wording are intentionally preserved. Select a message to inspect it in the job state."
      />
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="message-filter">Find a message</FieldLabel>
          <Input
            id="message-filter"
            placeholder="Search error text…"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </Field>
      </FieldGroup>
      <p className="text-xs text-muted-foreground">{filtered.length} messages</p>
      {filtered.length === 0 ? (
        <Empty>
          <EmptyHeader>
            <EmptyTitle>No matching messages</EmptyTitle>
            <EmptyDescription>Try a shorter phrase.</EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <WindowedList
          items={filtered}
          itemKey={(message) => message.id}
          label="Exact inventory messages"
          rowHeight={96}
          renderItem={(message) => (
            <Button
              variant="ghost"
              className="h-full w-full justify-start whitespace-normal text-left"
              onClick={() => reviewActions.scenario(message.id)}
            >
              <CircleAlert data-icon="inline-start" aria-hidden="true" />
              <span className="line-clamp-3 min-w-0 flex-1">{message.message}</span>
            </Button>
          )}
        />
      )}
    </div>
  )
}
function ListSpecimen(): React.JSX.Element | null {
  const snapshot = useStudioStore((s) => s.snapshot)
  if (!snapshot) return null
  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center justify-between gap-4">
        <SectionHeading
          title="Saved outputs"
          description={`${snapshot.outputs.length} items · windowed rows`}
        />
        <Button
          variant="outline"
          size="sm"
          onClick={() => act('Refresh library', { type: 'outputs.refresh' })}
        >
          <RefreshCw data-icon="inline-start" aria-hidden="true" />
          Refresh
        </Button>
      </div>
      <WindowedList
        items={snapshot.outputs}
        itemKey={(output) => output.id}
        label="Saved outputs"
        renderItem={(output) => (
          <Button
            variant={snapshot.selectedOutput === output.id ? 'secondary' : 'ghost'}
            className="h-full w-full justify-start"
            onClick={() => act('Select narration', { type: 'output.select', id: output.id })}
          >
            <FileAudio data-icon="inline-start" aria-hidden="true" />
            <span className="truncate">{output.title}</span>
          </Button>
        )}
      />
      <Separator />
      <SectionHeading
        title="Batch units"
        description="Completed items remain available when another item fails."
      />
      <ItemGroup>
        {snapshot.units.map((unit) => (
          <Item key={unit.id}>
            <ItemMedia>
              <FileText aria-hidden="true" />
            </ItemMedia>
            <ItemContent>
              <ItemTitle>{unit.title}</ItemTitle>
              <ItemDescription>
                {unit.message ?? `${unit.language.toUpperCase()} · current shared settings`}
              </ItemDescription>
            </ItemContent>
            <ItemActions>
              <Badge variant={unit.status === 'error' ? 'destructive' : 'secondary'}>
                {unit.status}
              </Badge>
            </ItemActions>
          </Item>
        ))}
      </ItemGroup>
      <div>
        <Button
          variant="outline"
          onClick={() =>
            act('Save completed batch', { type: 'output.export', id: 'batch', format: 'zip' })
          }
        >
          <Download data-icon="inline-start" aria-hidden="true" />
          Save completed items as ZIP
        </Button>
      </div>
    </div>
  )
}
export default function InterfaceReferencePage(): React.JSX.Element {
  const snapshot = useStudioStore((s) => s.snapshot)
  const error = useStudioStore((s) => s.error)
  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-3">
            <SlidersHorizontal className="size-5 text-muted-foreground" aria-hidden="true" />
            <h1 className="text-2xl font-semibold tracking-tight">Interface reference</h1>
            <Badge variant="outline">Foundation</Badge>
          </div>
          <p className="max-w-2xl text-sm text-muted-foreground">
            Shared controls, model capabilities and reviewable app states.
          </p>
        </div>
        <p className="text-xs text-muted-foreground">Mock session · no files are changed</p>
      </header>
      {error && (
        <Alert variant="destructive">
          <AlertTitle>Action could not finish</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      {snapshot?.status && (
        <Alert>
          <AlertTitle>Action result</AlertTitle>
          <AlertDescription>{snapshot.status}</AlertDescription>
        </Alert>
      )}
      {!snapshot ? (
        <div className="flex flex-col gap-4">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-80 w-full" />
        </div>
      ) : (
        <div className="flex min-w-0 flex-col gap-8 lg:flex-row">
          <Tabs
            defaultValue="workspace"
            className="min-w-0 flex-1"
            onValueChange={() => notify('Reference tab clicked')}
          >
            <TabsList className="mb-6 flex h-auto flex-wrap justify-start">
              <TabsTrigger value="workspace">Workspace</TabsTrigger>
              <TabsTrigger value="states">States</TabsTrigger>
              <TabsTrigger value="catalog">Catalogs</TabsTrigger>
              <TabsTrigger value="lists">Lists</TabsTrigger>
              <TabsTrigger value="messages">Messages</TabsTrigger>
            </TabsList>
            <TabsContent value="workspace">
              <WorkspaceSpecimen />
            </TabsContent>
            <TabsContent value="states">
              <StateSpecimens />
            </TabsContent>
            <TabsContent value="catalog">
              <CatalogSpecimens />
            </TabsContent>
            <TabsContent value="lists">
              <ListSpecimen />
            </TabsContent>
            <TabsContent value="messages">
              <MessageSpecimens />
            </TabsContent>
          </Tabs>
          <aside className="order-first flex flex-col gap-6 lg:sticky lg:top-0 lg:order-last lg:w-64 lg:shrink-0 lg:self-start">
            <ScenarioControls />
            <Separator />
            <JobStatus job={snapshot.job} compact />
          </aside>
        </div>
      )}
    </div>
  )
}
