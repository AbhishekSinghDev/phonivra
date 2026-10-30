import { useState } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  AudioLinesIcon,
  CheckIcon,
  MicIcon,
  PlayIcon,
  RefreshCwIcon,
  UsersIcon
} from '@hugeicons/core-free-icons'
import { ScreenFrame, ScreenLoading, DetailValue } from '@/components/studio/screen-frame'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger
} from '@phonivra/ui/components/sheet'
import { ScrollArea } from '@phonivra/ui/components/scroll-area'
import { Button } from '@phonivra/ui/components/button'
import { Badge } from '@phonivra/ui/components/badge'
import { Input } from '@phonivra/ui/components/input'
import { Field, FieldGroup, FieldLabel } from '@phonivra/ui/components/field'
import { ToggleGroup, ToggleGroupItem } from '@phonivra/ui/components/toggle-group'
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle
} from '@phonivra/ui/components/empty'
import { Separator } from '@phonivra/ui/components/separator'
import { WindowedList } from '@/components/studio/windowed-list'
import { AudioTransport } from '@/components/studio/audio-transport'
import { ReferenceAttachment } from '@/components/studio/reference-attachment'
import { VoicePresetControls } from '@/components/studio/voice-preset-controls'
import { ConfirmDelete } from '@/components/studio/confirm-delete'
import { JobStatus, activePhases } from '@/components/studio/job-status'
import { CatalogSelect } from '@/components/studio/catalog-select'
import { useStudioStore } from '@/stores/studio-store'
import { act, updateSettings } from '@/lib/actions'
import { notify } from '@/lib/notify'
import { languages, models, resolvedModel } from '../../../../shared/data/catalog'
import type { GenerationSettings } from '../../../../shared/studio'

const filters = [
  { value: 'all', label: 'All voices' },
  { value: 'built-in', label: 'Built-in' },
  { value: 'external', label: 'Recordings' },
  { value: 'custom', label: 'My voices' }
]
export function VoicesModelsPage(): React.JSX.Element {
  const snapshot = useStudioStore((state) => state.snapshot)
  const [query, setQuery] = useState('')
  const [kind, setKind] = useState('all')
  const [inspected, setInspected] = useState<string | null>(null)
  if (!snapshot) return <ScreenLoading />
  const voice =
    snapshot.voices.find((item) => item.id === inspected) ??
    snapshot.voices.find((item) => item.id === snapshot.settings.voice) ??
    snapshot.voices[0]
  const filtered = snapshot.voices.filter(
    (item) =>
      (kind === 'all' || item.kind === kind) &&
      item.label.toLowerCase().includes(query.toLowerCase())
  )
  const active = activePhases.has(snapshot.job.phase)
  const effective = resolvedModel(snapshot.settings)
  async function preview(): Promise<void> {
    if (!voice) return
    await act('Use voice for preview', {
      type: 'settings.update',
      settings: { ...snapshot!.settings, voice: voice.id }
    })
    await act('Generate voice preview', { type: 'job.start', kind: 'preview' })
  }
  return (
    <Sheet>
      <ScreenFrame
        title="Voice collection"
        description={
          <>
            Find your <span className="highlight">Signature sound.</span> Explore voices and build
            your own collection.
          </>
        }
      >
        <div className="flex min-w-0 flex-col gap-6 lg:flex-row">
          <section
            aria-label="Voice catalog"
            className="flex min-w-0 flex-col gap-4 lg:w-80 lg:shrink-0"
          >
            <div className="flex flex-wrap items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => act('Refresh voices', { type: 'voices.refresh' })}
              >
                <HugeiconsIcon icon={RefreshCwIcon} data-icon="inline-start" aria-hidden="true" />
                Refresh
              </Button>
              <SheetTrigger asChild>
                <Button size="sm" onClick={() => notify('Create voice clicked')}>
                  <HugeiconsIcon icon={MicIcon} data-icon="inline-start" aria-hidden="true" />
                  Create a voice
                </Button>
              </SheetTrigger>
            </div>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="voice-search">Find a voice</FieldLabel>
                <Input
                  id="voice-search"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search voice names…"
                />
              </Field>
            </FieldGroup>
            <ToggleGroup
              type="single"
              value={kind}
              variant="outline"
              spacing={1}
              className="grid w-full grid-cols-2"
              aria-label="Voice source"
              onValueChange={(value) => {
                if (value) {
                  setKind(value)
                  notify('Filter voices clicked')
                }
              }}
            >
              {filters.map((filter) => (
                <ToggleGroupItem key={filter.value} value={filter.value}>
                  {filter.label}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
            <p className="text-xs text-muted-foreground">{filtered.length} voices</p>
            {filtered.length ? (
              <WindowedList
                items={filtered}
                itemKey={(item) => item.id}
                label="Available voices"
                rowHeight={80}
                renderItem={(item) => (
                  <Button
                    variant={voice?.id === item.id ? 'secondary' : 'ghost'}
                    className="h-full w-full justify-start gap-3 rounded-xl px-4"
                    onClick={() => {
                      setInspected(item.id)
                      notify('Inspect voice clicked')
                    }}
                  >
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-secondary text-secondary-foreground">
                      <HugeiconsIcon icon={AudioLinesIcon} className="size-5" aria-hidden="true" />
                    </span>
                    <span className="flex min-w-0 flex-1 flex-col items-start gap-1">
                      <span className="truncate">{item.label}</span>
                      <span className="text-xs text-muted-foreground">
                        {item.kind === 'built-in'
                          ? 'Built-in preset'
                          : item.kind === 'custom'
                            ? 'Saved preset'
                            : 'Discovered recording'}
                      </span>
                    </span>
                    {snapshot.settings.voice === item.id && (
                      <HugeiconsIcon icon={CheckIcon} aria-label="Selected for narration" />
                    )}
                    {!item.available && <Badge variant="destructive">Missing</Badge>}
                  </Button>
                )}
              />
            ) : (
              <Empty>
                <EmptyHeader>
                  <EmptyMedia variant="icon">
                    <HugeiconsIcon icon={UsersIcon} aria-hidden="true" />
                  </EmptyMedia>
                  <EmptyTitle>No matching voices</EmptyTitle>
                  <EmptyDescription>
                    Try another name or source. Refresh to discover new recordings.
                  </EmptyDescription>
                </EmptyHeader>
              </Empty>
            )}
          </section>
          <section
            aria-label="Selected voice"
            className="flex min-w-0 flex-1 flex-col gap-6 card-chai p-6"
          >
            {voice && (
              <>
                <div className="flex h-36 items-center justify-center rounded-xl border border-card-edge bg-card-fill">
                  <div className="flex size-20 items-center justify-center rounded-full bg-card text-primary">
                    <HugeiconsIcon icon={AudioLinesIcon} className="size-10" aria-hidden="true" />
                  </div>
                </div>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex min-w-0 flex-col gap-2">
                    <h2 className="break-words text-lg font-semibold">{voice.label}</h2>
                    <p className="text-sm text-muted-foreground">{voice.description}</p>
                  </div>
                  <Badge variant="outline">{voice.kind}</Badge>
                </div>
                <AudioTransport
                  id={`voice:${voice.id}`}
                  title={voice.previewAvailable ? 'Voice audition' : 'Reference recording'}
                  duration={voice.duration ?? 12}
                  playing={
                    snapshot.playback.outputId === `voice:${voice.id}` && snapshot.playback.playing
                  }
                  position={
                    snapshot.playback.outputId === `voice:${voice.id}`
                      ? snapshot.playback.position
                      : 0
                  }
                  state={voice.available ? 'ready' : 'unavailable'}
                />
                <dl className="grid grid-cols-2 gap-4">
                  <DetailValue label="Reference duration">
                    {voice.duration === null ? 'Model built-in voice' : `${voice.duration}s`}
                  </DetailValue>
                  <DetailValue label="Language compatibility">
                    Any language supported by the model
                  </DetailValue>
                </dl>
                <div className="flex flex-wrap gap-2">
                  <Button
                    disabled={!voice.available || snapshot.settings.voice === voice.id}
                    onClick={() => updateSettings('voice', voice.id)}
                  >
                    {snapshot.settings.voice === voice.id
                      ? 'Selected for narration'
                      : 'Use this voice'}
                  </Button>
                  <ConfirmDelete
                    name={voice.label}
                    description="Delete this custom preset. Built-in voices and external recordings are protected."
                    disabled={voice.kind !== 'custom'}
                    onConfirm={() =>
                      act('Delete voice preset', {
                        type: 'voice.delete',
                        id: voice.id,
                        confirmed: true
                      })
                    }
                  />
                </div>
                {voice.kind !== 'custom' && (
                  <p className="text-xs text-muted-foreground">
                    Built-in voices and discovered recordings cannot be deleted here.
                  </p>
                )}
              </>
            )}
          </section>
        </div>
        <SheetContent className="sm:max-w-xl">
          <SheetHeader>
            <SheetTitle>Create & preview a voice</SheetTitle>
            <SheetDescription>
              Start with a recording, save a preset, or try the current voice with custom settings.
            </SheetDescription>
          </SheetHeader>
          <ScrollArea className="min-h-0 flex-1 px-6 pb-6">
            <div className="flex flex-col gap-6">
              <ReferenceAttachment reference={snapshot.reference} />
              <VoicePresetControls showDelete={false} />
              <p className="text-xs leading-relaxed text-muted-foreground">
                Use a clean recording you have permission to clone. No training or reference
                transcript is needed. Saving uses mono 24 kHz WAV, up to 40 seconds.
              </p>
              <Separator />
              <h2 className="text-base font-semibold">Preview with your settings</h2>
              <FieldGroup>
                <CatalogSelect
                  label="Preview model"
                  value={snapshot.settings.model}
                  options={models.map((model) => ({ value: model.id, label: model.label }))}
                  onChange={(value) =>
                    updateSettings('model', value as GenerationSettings['model'])
                  }
                />
                <CatalogSelect
                  label="Preview language"
                  value={snapshot.settings.language}
                  options={languages.map((language) => ({
                    value: language.code,
                    label: language.label,
                    description: language.nativeLabel
                  }))}
                  onChange={(value) =>
                    updateSettings('language', value as GenerationSettings['language'])
                  }
                />
              </FieldGroup>
              <p className="text-sm text-muted-foreground">
                Previewing selects this voice for Narrate and Batch. Model and language changes also
                apply there. Uses a fixed sample with your sampling, seed and speed. Script,
                dictionary and publishing settings are not used.
              </p>
              {snapshot.reference.status === 'ready' && (
                <p className="text-sm leading-relaxed text-muted-foreground">
                  The attached reference overrides the preset. Clear it to preview{' '}
                  {voice?.label ?? 'the selected voice'}.
                </p>
              )}
              <Button
                variant="outline"
                disabled={active || !voice?.available}
                onClick={() => void preview()}
              >
                <HugeiconsIcon icon={PlayIcon} data-icon="inline-start" aria-hidden="true" />
                Generate voice preview
              </Button>
              {snapshot.job.kind === 'preview' && snapshot.job.phase !== 'idle' && (
                <JobStatus job={snapshot.job} />
              )}
              {snapshot.preview && (
                <AudioTransport
                  id={snapshot.preview.id}
                  title="Generated voice preview"
                  duration={snapshot.preview.duration}
                  playing={
                    snapshot.playback.outputId === snapshot.preview.id && snapshot.playback.playing
                  }
                  position={
                    snapshot.playback.outputId === snapshot.preview.id
                      ? snapshot.playback.position
                      : 0
                  }
                />
              )}
              <p className="text-xs leading-relaxed text-muted-foreground">
                {effective.label} uses up to {effective.conditioningSeconds}s for speech
                conditioning and up to 10s for the decoder. Previews are kept separately from the
                Library.
              </p>
            </div>
          </ScrollArea>
        </SheetContent>
      </ScreenFrame>
    </Sheet>
  )
}
