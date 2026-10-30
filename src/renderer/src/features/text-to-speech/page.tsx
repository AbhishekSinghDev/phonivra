import { lazy, Suspense, useCallback, useState } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  AudioLinesIcon,
  ArrowUpRightIcon,
  HeadphonesIcon,
  PlayIcon,
  ShieldCheckIcon,
  SquareIcon
} from '@hugeicons/core-free-icons'
import { Link } from 'react-router'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { ScreenLoading } from '@/components/studio/screen-frame'
import { Spinner } from '@/components/ui/spinner'
import { SettingsInspector } from '@/components/studio/settings-inspector'
import { activePhases } from '@/components/studio/job-status'
import { EssentialSettings } from '@/components/studio/settings-fields'
import { NarrationEditor } from './parts/narration-editor'
import { NarrationNotices } from './parts/narration-notices'
import { NarrationResult } from './parts/narration-result'
import { VoiceTools } from '@/components/studio/voice-tools'
import { act } from '@/lib/actions'
import { notify } from '@/lib/notify'
import { useStudioStore } from '@/stores/studio-store'
import { resolvedModel } from '../../../../shared/data/catalog'

const TextInspection = lazy(() => import('./parts/text-inspection'))
export function TextToSpeechPage(): React.JSX.Element {
  const snapshot = useStudioStore((state) => state.snapshot)
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
  if (!snapshot) return <ScreenLoading />
  const { settings, job, dependencies } = snapshot
  const active = activePhases.has(job.phase)
  const narrationActive = active && (job.kind === 'narration' || job.kind === 'preview')
  const model = resolvedModel(settings)
  const selectedVoice = snapshot.voices.find((voice) => voice.id === settings.voice)
  const voiceName =
    snapshot.reference.status === 'ready'
      ? snapshot.reference.name
      : (selectedVoice?.label ?? 'Choose a voice')
  const installation = snapshot.models.find((item) => item.id === model.id)
  return (
    <div className="studio-page mx-auto flex w-full max-w-6xl flex-col gap-7 pb-6">
      <header className="flex flex-col items-center gap-4 text-center">
        <div className="flex flex-col items-center gap-3">
          <div className="flex flex-col items-center gap-3">
            <h1 className="text-2xl font-medium tracking-tight sm:text-3xl">Text to speech</h1>
          </div>
          <p className="text-base leading-relaxed text-muted-foreground">
            Your words, <span className="highlight">Brought to life.</span> Write a script and make
            it sound like you.
          </p>
        </div>
      </header>
      <div className="flex min-w-0 flex-col items-start gap-6 md:flex-row xl:gap-8">
        <div className="flex min-w-0 flex-1 flex-col gap-4 self-stretch">
          <Card className="min-w-0 flex-1 overflow-visible">
            <NarrationEditor
              key={snapshot.documentRevision}
              initialText={snapshot.script}
              title={settings.title}
              reactions={model.reactions}
              inspect={inspect}
              onGenerate={generate}
            />
            <div className="sticky bottom-0 z-10 mt-auto flex flex-wrap items-center justify-between gap-3 rounded-b-2xl border-t border-border bg-card px-6 py-4">
              <span className="flex items-center gap-2 text-xs text-muted-foreground">
                <HugeiconsIcon icon={ShieldCheckIcon} className="size-4" aria-hidden="true" />
                Generated on your device
              </span>
              {narrationActive ? (
                <Button
                  size="lg"
                  variant="secondary"
                  disabled={job.phase === 'stopping'}
                  onClick={() => act('Stop generation', { type: 'job.cancel' })}
                >
                  {job.phase === 'stopping' ? (
                    <Spinner data-icon="inline-start" aria-hidden="true" />
                  ) : (
                    <HugeiconsIcon icon={SquareIcon} data-icon="inline-start" aria-hidden="true" />
                  )}
                  {job.phase === 'stopping' ? 'Stopping…' : 'Stop'}
                </Button>
              ) : (
                <Button className="studio-primary" size="lg" disabled={active} onClick={generate}>
                  {installation?.status === 'not-installed' && dependencies.online
                    ? 'Download and generate'
                    : 'Generate narration'}
                  <HugeiconsIcon
                    icon={ArrowUpRightIcon}
                    data-icon="inline-end"
                    aria-hidden="true"
                  />
                </Button>
              )}
            </div>
          </Card>
          <NarrationNotices />
          {active && (
            <p className="text-sm text-muted-foreground" role="status">
              {narrationActive ? (
                `${job.message} Changes apply to your next take.`
              ) : (
                <>
                  Another job is running.{' '}
                  <Link to={job.kind === 'batch' ? '/batch' : '/models'}>View current job</Link> to
                  check progress or stop it.
                </>
              )}
            </p>
          )}
        </div>
        <aside
          aria-labelledby="narration-voice-heading"
          className="card-chai flex w-full min-w-0 flex-col gap-5 p-5 md:w-72 md:shrink-0 xl:w-80"
        >
          <div className="flex items-center justify-between">
            <h2 id="narration-voice-heading" className="text-sm font-semibold">
              Voice settings
            </h2>
            <HugeiconsIcon
              icon={HeadphonesIcon}
              className="size-4 text-muted-foreground"
              aria-hidden="true"
            />
          </div>
          <div className="flex items-center gap-3 card-chai p-4">
            <div className="flex size-11 shrink-0 items-center justify-center rounded-full border border-card-edge bg-card-fill text-highlight">
              <HugeiconsIcon icon={AudioLinesIcon} className="size-5" aria-hidden="true" />
            </div>
            <div className="flex min-w-0 flex-1 flex-col gap-1">
              <p className="truncate text-sm font-semibold" title={voiceName}>
                {voiceName}
              </p>
              <p className="text-xs text-muted-foreground">
                {snapshot.reference.status === 'ready'
                  ? 'Reference recording'
                  : selectedVoice?.kind === 'custom'
                    ? 'Your saved voice'
                    : 'Built-in voice'}
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              aria-label="Preview voice"
              disabled={active}
              onClick={() => act('Generate voice preview', { type: 'job.start', kind: 'preview' })}
            >
              <HugeiconsIcon icon={PlayIcon} aria-hidden="true" />
            </Button>
          </div>
          <EssentialSettings />
          <VoiceTools />
          <Separator />
          <SettingsInspector />
          {installation?.status === 'not-installed' && (
            <p className="text-xs leading-relaxed text-muted-foreground">
              This model downloads before first use. Installed models work offline.
            </p>
          )}
        </aside>
      </div>
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
