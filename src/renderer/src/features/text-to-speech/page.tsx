import { lazy, Suspense, useCallback, useState } from 'react'
import {
  AudioLines,
  ChevronDown,
  FileJson,
  FolderOpen,
  RotateCcw,
  Save,
  Square
} from 'lucide-react'
import { Link } from 'react-router'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Skeleton } from '@/components/ui/skeleton'
import { Spinner } from '@/components/ui/spinner'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { SettingsInspector } from '@/components/studio/settings-inspector'
import { DictionaryEditor } from '@/components/studio/dictionary-editor'
import { activePhases } from '@/components/studio/job-status'
import { BooleanField } from '@/components/studio/settings-fields'
import { NarrationEditor } from './parts/narration-editor'
import { NarrationSetup } from './parts/narration-setup'
import { NarrationNotices } from './parts/narration-notices'
import { NarrationResult } from './parts/narration-result'
import { VoiceTools } from './parts/voice-tools'
import { act, updateSettings } from '@/lib/actions'
import { notify } from '@/lib/notify'
import { useStudioStore } from '@/stores/studio-store'
import { languages, resolvedModel } from '../../../../shared/data/catalog'

const TextInspection = lazy(() => import('./parts/text-inspection'))
const NarrateReviewTools = import.meta.env.DEV
  ? lazy(() => import('./parts/narrate-review-tools'))
  : null
export function TextToSpeechPage(): React.JSX.Element {
  const snapshot = useStudioStore((state) => state.snapshot)
  const error = useStudioStore((state) => state.error)
  const [inspectionOpen, setInspectionOpen] = useState(false)
  const inspect = useCallback(() => {
    setInspectionOpen(true)
    void act('Inspect text and parts', { type: 'script.inspect' })
  }, [])
  const generate = useCallback(() => {
    const current = useStudioStore.getState().snapshot
    if (!current || activePhases.has(current.job.phase)) return
    void act('Generate narration', { type: 'job.start', kind: 'narration' }).then(() => {
      if (!useStudioStore.getState().snapshot?.script.trim())
        document.getElementById('narrate-script')?.focus()
    })
  }, [])
  if (!snapshot)
    return (
      <section aria-label="Loading narration workspace" className="flex flex-col gap-6">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-96 w-full" />
      </section>
    )
  const { settings, reference, job, device, dependencies } = snapshot
  const active = activePhases.has(job.phase)
  const model = resolvedModel(settings)
  const language = languages.find((item) => item.code === settings.language)
  const selectedVoice = snapshot.voices.find((item) => item.id === settings.voice)
  const voiceLabel =
    reference.status === 'ready' ? reference.name : (selectedVoice?.label ?? 'Choose a voice')
  const installation = snapshot.models.find((item) => item.id === model.id)
  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 pb-4">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-semibold tracking-tight">Narrate</h1>
          <Badge variant="outline">Local</Badge>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {NarrateReviewTools && (
            <Suspense fallback={null}>
              <NarrateReviewTools />
            </Suspense>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" onClick={() => notify('Project menu clicked')}>
                <FileJson data-icon="inline-start" aria-hidden="true" />
                Project
                <ChevronDown data-icon="inline-end" aria-hidden="true" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuGroup>
                <DropdownMenuItem onSelect={() => act('Save project', { type: 'project.save' })}>
                  <Save aria-hidden="true" />
                  Save project
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={() => act('Open project', { type: 'project.open' })}>
                  <FolderOpen aria-hidden="true" />
                  Open project JSON
                </DropdownMenuItem>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuItem
                  onSelect={() => act('Restore generation defaults', { type: 'settings.restore' })}
                >
                  <RotateCcw aria-hidden="true" />
                  Restore generation defaults
                </DropdownMenuItem>
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>
      {(error || snapshot.status) && (
        <Alert variant={error || snapshot.statusIsError ? 'destructive' : 'default'}>
          <AlertTitle>{error ? 'Action could not finish' : 'Narration status'}</AlertTitle>
          <AlertDescription>
            <span>{error ?? snapshot.status}</span>
            <Button
              variant="link"
              size="sm"
              onClick={() => {
                useStudioStore.getState().setError(null)
                void act('Dismiss status', { type: 'status.dismiss' })
              }}
            >
              Dismiss
            </Button>
          </AlertDescription>
        </Alert>
      )}
      <div className="xl:hidden">
        <NarrationSetup compact />
      </div>
      <div className="flex min-w-0 flex-col gap-8 xl:flex-row">
        <div className="flex min-w-0 flex-1 flex-col gap-5">
          <NarrationEditor
            key={`${snapshot.scenario}:${snapshot.documentRevision}`}
            initialText={snapshot.script}
            title={settings.title}
            reactions={model.reactions}
            inspect={inspect}
            onGenerate={generate}
          />
          <div className="flex flex-wrap items-center gap-2">
            <SettingsInspector />
            <VoiceTools />
            <DictionaryEditor />
          </div>
          <NarrationNotices />
        </div>
        <aside
          aria-label="Narration settings"
          className="hidden w-80 shrink-0 flex-col gap-5 xl:flex"
        >
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-sm font-semibold">Narration settings</h2>
            <Badge variant="secondary">
              {model.id === 'multilingual' ? '23 languages' : 'English'}
            </Badge>
          </div>
          <NarrationSetup />
          <Separator />
          <div className="flex flex-col gap-2">
            <p className="text-xs font-medium">Effective voice</p>
            <p className="break-words text-sm">{voiceLabel}</p>
            {reference.status === 'ready' && (
              <p className="text-xs text-muted-foreground">
                Reference recording overrides your selected preset.
              </p>
            )}
            <p className="text-xs text-muted-foreground">
              {model.label} · {language?.label}
            </p>
          </div>
          {installation?.status === 'not-installed' && (
            <p className="text-xs leading-relaxed text-muted-foreground">
              This model downloads before first use. Installed models work offline.
            </p>
          )}
          <p className="text-xs text-muted-foreground">
            {device.label}
            {device.vram && ` · ${device.vram}`}
          </p>
        </aside>
      </div>
      <div className="xl:hidden">
        <BooleanField
          label="Detect language"
          description="One language per narration; detection is approximate."
          checked={settings.auto_detect}
          onChange={(value) => updateSettings('auto_detect', value)}
        />
        {reference.status === 'ready' && (
          <p className="mt-3 text-xs text-muted-foreground">
            Using reference: {reference.name}. Clear it in Voice reference to use the preset.
          </p>
        )}
      </div>
      <div className="sticky bottom-0 flex flex-wrap items-center justify-between gap-4 rounded-lg border border-border bg-background p-4 shadow-sm">
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <p className="truncate text-sm font-medium">
            {active
              ? job.message
              : job.phase === 'complete'
                ? 'Your take is ready'
                : 'Ready to narrate'}
          </p>
          <p className="text-xs text-muted-foreground">
            {active
              ? `Current job uses its starting settings. Changes apply to the next take.`
              : `${model.label} · ${settings.format.toUpperCase()} · ${settings.speed}× speed`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            disabled={active}
            onClick={() => act('Generate voice preview', { type: 'job.start', kind: 'preview' })}
          >
            Voice preview
          </Button>
          {active ? (
            <Button
              variant="outline"
              disabled={job.phase === 'stopping'}
              onClick={() => act('Stop generation', { type: 'job.cancel' })}
            >
              {job.phase === 'stopping' ? (
                <Spinner data-icon="inline-start" aria-hidden="true" />
              ) : (
                <Square data-icon="inline-start" aria-hidden="true" />
              )}
              {job.phase === 'stopping' ? 'Stopping…' : 'Stop'}
            </Button>
          ) : (
            <Button onClick={generate}>
              <AudioLines data-icon="inline-start" aria-hidden="true" />
              {installation?.status === 'not-installed' && dependencies.online
                ? 'Download and generate'
                : 'Generate narration'}
            </Button>
          )}
        </div>
      </div>
      <Separator />
      <NarrationResult />
      <p className="text-xs leading-relaxed text-muted-foreground">
        Audio is generated on this device and includes the Resemble Perth watermark.{' '}
        <Button variant="link" size="sm" asChild>
          <Link to="/models" onClick={() => notify('View models clicked')}>
            Model details
          </Link>
        </Button>
      </p>
      {inspectionOpen && (
        <Suspense fallback={null}>
          <TextInspection open={inspectionOpen} onOpenChange={setInspectionOpen} />
        </Suspense>
      )}
    </div>
  )
}
