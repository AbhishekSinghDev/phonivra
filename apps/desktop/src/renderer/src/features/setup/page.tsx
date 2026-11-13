import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router'
import { Button } from '@phonivra/ui/components/button'
import { Spinner } from '@phonivra/ui/components/spinner'
import { CatalogSelect } from '@/components/studio/catalog-select'
import { activePhases, JobStatus } from '@/components/studio/job-status'
import { act, dispatchStudioCommand, retryStudioConnection } from '@/lib/actions'
import { useStudioStore } from '@/stores/studio-store'
import { languages, models } from '../../../../shared/data/catalog'
import type { LanguageCode, ModelId, StudioSnapshot } from '../../../../shared/studio'

const steps = ['Check device', 'Choose language', 'Prepare model', 'Test audio'] as const
const setupLanguages = models.find(({ id }) => id === 'multilingual')?.languages ?? []
const languageOptions = languages
  .filter(({ code }) => setupLanguages.includes(code))
  .map(({ code, label, nativeLabel }) => ({ value: code, label, description: nativeLabel }))

type DownloadableModel = Exclude<ModelId, 'auto'>

function isInstalled(snapshot: StudioSnapshot, id: DownloadableModel): boolean {
  return snapshot.models.some(
    (model) => model.id === id && (model.status === 'installed' || model.status === 'active')
  )
}

function formatSize(bytes: number): string {
  return bytes < 1_000_000_000
    ? `${Math.round(bytes / 1_000_000)} MB`
    : `${(bytes / 1_000_000_000).toFixed(2)} GB`
}

export function SetupPage(): React.JSX.Element {
  const navigate = useNavigate()
  const snapshot = useStudioStore((state) => state.snapshot)
  const connectionError = useStudioStore((state) => state.error)
  const [stepChoice, setStep] = useState<number | null>(null)
  const [languageChoice, setLanguageChoice] = useState<LanguageCode | null>(null)
  const [pending, setPending] = useState(false)
  const [previousPreview, setPreviousPreview] = useState<string | null>(null)
  const [previewRequested, setPreviewRequested] = useState(false)
  const heading = useRef<HTMLHeadingElement>(null)
  const step =
    stepChoice ??
    (snapshot?.setup.resuming && snapshot.setup.mediaReady && snapshot.device.available ? 2 : 0)

  useEffect(() => {
    heading.current?.focus()
  }, [step])

  async function run(action: () => Promise<unknown>): Promise<void> {
    setPending(true)
    try {
      await action()
    } finally {
      setPending(false)
    }
  }

  const savedLanguage = snapshot?.settings.language
  const language =
    languageChoice ??
    (savedLanguage && setupLanguages.includes(savedLanguage) ? savedLanguage : 'en')
  const model = 'multilingual'
  const modelName = models.find((entry) => entry.id === model)?.label ?? model
  const selectedModel = snapshot?.settings.model
  const preparedModel = selectedModel === 'turbo' && language === 'en' ? selectedModel : model
  const preparedName = models.find((entry) => entry.id === preparedModel)?.label ?? preparedModel
  const ready = snapshot ? isInstalled(snapshot, preparedModel) : false
  const job = snapshot?.job
  const active = !!job && activePhases.has(job.phase)
  const size = snapshot?.setup.modelSizes[preparedModel]
  const free = snapshot?.setup.freeBytes
  const canPause = snapshot?.models.some(
    (entry) => entry.id === preparedModel && ['paused', 'downloading'].includes(entry.status)
  )
  const preview =
    previewRequested &&
    snapshot?.preview?.id !== previousPreview &&
    job?.kind === 'preview' &&
    job.phase === 'complete'
      ? snapshot?.preview
      : null

  async function chooseLanguage(): Promise<void> {
    if (!snapshot) return
    const updated = await dispatchStudioCommand({
      type: 'settings.update',
      settings: { ...snapshot.settings, language, model, voice: 'default', auto_detect: false }
    })
    if (!updated) return
    setStep(2)
    if (!isInstalled(snapshot, model) && snapshot.setup.modelSizes[model] === undefined) {
      await dispatchStudioCommand({ type: 'setup.model-size', id: model })
    }
  }

  async function generateTest(useCpu = false): Promise<void> {
    if (!snapshot) return
    if (useCpu && !(await dispatchStudioCommand({ type: 'device.set', mode: 'cpu' }))) return
    setPreviousPreview(snapshot.preview?.id ?? null)
    setPreviewRequested(true)
    await dispatchStudioCommand({ type: 'job.start', kind: 'preview' })
  }

  return (
    <div className="mx-auto flex min-h-full max-w-4xl items-start justify-center py-6 sm:items-center sm:py-12">
      <section
        aria-labelledby="setup-heading"
        className="w-full max-w-xl rounded-2xl border border-card-edge bg-card p-6 sm:p-9"
      >
        <ol aria-label="Setup progress" className="mb-8 grid grid-cols-4 gap-2 text-xs sm:gap-4">
          {steps.map((label, index) => (
            <li
              key={label}
              aria-current={index === step ? 'step' : undefined}
              aria-label={index < step ? `${label}, completed` : label}
              className={index === step ? 'font-medium' : 'text-muted-foreground'}
            >
              <span
                aria-hidden="true"
                className={`mb-2 block h-1 rounded-full ${index <= step ? 'bg-primary' : 'bg-muted'}`}
              />
              {label}
            </li>
          ))}
        </ol>

        <h1
          id="setup-heading"
          ref={heading}
          tabIndex={-1}
          className="text-balance text-2xl font-semibold tracking-tight outline-none sm:text-3xl"
        >
          {
            [
              'Set up Phonivra',
              'Choose your narration language',
              'Prepare your speech model',
              'Hear your first test clip'
            ][step]
          }
        </h1>
        <div className="mt-4 flex flex-col gap-5">
          {(connectionError || snapshot?.statusIsError) && (
            <p role="alert" className="break-words text-sm text-destructive">
              {connectionError ?? snapshot?.status}
            </p>
          )}

          {step === 0 && (
            <>
              <p className="text-sm leading-relaxed text-muted-foreground">
                Set up local speech generation on this device. Your scripts and audio stay here.
              </p>
              {!snapshot && !connectionError && (
                <p role="status" className="flex items-center gap-2 text-sm">
                  <Spinner /> Starting the local engine…
                </p>
              )}
              {snapshot && (
                <dl className="flex flex-col gap-3 border-y border-card-edge py-4 text-sm">
                  <div className="flex justify-between gap-3">
                    <dt>Local engine</dt>
                    <dd>Ready</dd>
                  </div>
                  <div className="flex justify-between gap-3">
                    <dt>Audio tools</dt>
                    <dd>{snapshot.setup.mediaReady ? 'Ready' : 'Missing'}</dd>
                  </div>
                  <div className="flex justify-between gap-3">
                    <dt>Compute device</dt>
                    <dd className="text-right">{snapshot.device.label}</dd>
                  </div>
                </dl>
              )}
              {snapshot && !snapshot.setup.mediaReady && (
                <p className="text-sm text-muted-foreground">
                  Phonivra needs FFmpeg and FFprobe. Reinstall Phonivra to restore the bundled audio
                  tools, then reopen setup.
                </p>
              )}
              {snapshot?.setup.mediaReady && (
                <details className="text-sm">
                  <summary className="cursor-pointer">Advanced device options</summary>
                  <div className="mt-3">
                    <CatalogSelect
                      label="Compute preference"
                      value={snapshot.device.mode}
                      disabled={pending}
                      options={[
                        { value: 'auto', label: 'Automatic' },
                        { value: 'cpu', label: 'CPU' },
                        ...(window.api.platform === 'win32'
                          ? [{ value: 'directml', label: 'Windows DirectML (preview)' }]
                          : []),
                        ...(snapshot.device.mode !== 'auto' &&
                        snapshot.device.mode !== 'cpu' &&
                        !(window.api.platform === 'win32' && snapshot.device.mode === 'directml')
                          ? [
                              {
                                value: snapshot.device.mode,
                                label:
                                  snapshot.device.mode === 'rocm'
                                    ? 'AMD ROCm'
                                    : snapshot.device.mode.toUpperCase()
                              }
                            ]
                          : [])
                      ]}
                      onChange={(value) =>
                        void run(() =>
                          dispatchStudioCommand({
                            type: 'device.set',
                            mode:
                              value === 'cpu'
                                ? 'cpu'
                                : value === 'auto'
                                  ? 'auto'
                                  : value === 'directml'
                                    ? 'directml'
                                    : snapshot.device.mode
                          })
                        )
                      }
                    />
                  </div>
                </details>
              )}
              <div className="flex flex-wrap justify-end gap-2">
                {(connectionError || (snapshot && !snapshot.setup.mediaReady)) && (
                  <Button
                    variant="outline"
                    disabled={pending}
                    onClick={() => void run(retryStudioConnection)}
                  >
                    Retry checks
                  </Button>
                )}
                {snapshot?.setup.mediaReady && !snapshot.device.available && (
                  <Button
                    disabled={pending}
                    onClick={() =>
                      void run(() => dispatchStudioCommand({ type: 'device.set', mode: 'auto' }))
                    }
                  >
                    Select device automatically
                  </Button>
                )}
                <Button
                  disabled={pending || !snapshot?.setup.mediaReady || !snapshot.device.available}
                  onClick={() => setStep(1)}
                >
                  Continue
                </Button>
              </div>
            </>
          )}

          {step === 1 && (
            <>
              <CatalogSelect
                label="Narration language"
                value={language}
                options={languageOptions}
                onChange={(value) => {
                  const selected = languages.find((entry) => entry.code === value)
                  if (selected) setLanguageChoice(selected.code)
                }}
                disabled={pending}
              />
              <p className="text-sm text-muted-foreground">
                You can set up more languages from Speech models after opening the studio.
              </p>
              <p className="text-sm text-muted-foreground">
                Recommended model <span className="font-medium text-foreground">{modelName}</span>
                {snapshot && isInstalled(snapshot, model) ? ' · Already installed' : ''}
              </p>
              <div className="flex justify-between gap-2">
                <Button variant="ghost" disabled={pending} onClick={() => setStep(0)}>
                  Back
                </Button>
                <Button disabled={pending} onClick={() => void run(chooseLanguage)}>
                  Continue
                </Button>
              </div>
            </>
          )}

          {step === 2 && snapshot && (
            <>
              <div className="border-y border-card-edge py-4">
                <p className="font-medium">{preparedName}</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {ready
                    ? 'Installed on this device.'
                    : size
                      ? `Model size: ${formatSize(size)}.`
                      : pending
                        ? 'Checking model size…'
                        : 'Model size unavailable.'}
                  {!ready && free != null ? ` ${formatSize(free)} free in the model folder.` : ''}
                </p>
              </div>
              {!ready && size != null && free != null && free < size && (
                <p className="text-sm text-muted-foreground">
                  If the download runs out of space, free up disk space or choose another model
                  folder.
                </p>
              )}
              {!ready && !active && (
                <p className="text-sm leading-relaxed text-muted-foreground">
                  Connect to the internet to download the model. If you close Phonivra during the
                  download, reopen it to resume here.
                </p>
              )}
              {job?.kind === 'download' && job.phase !== 'idle' && <JobStatus job={job} compact />}
              <div className="flex flex-wrap justify-between gap-2">
                <Button variant="ghost" disabled={pending || active} onClick={() => setStep(1)}>
                  Back
                </Button>
                <div className="flex flex-wrap gap-2">
                  {!ready && !active && size === undefined && snapshot.setup.resuming && (
                    <Button
                      variant="outline"
                      disabled={pending}
                      onClick={() =>
                        void run(() =>
                          dispatchStudioCommand({ type: 'setup.model-size', id: preparedModel })
                        )
                      }
                    >
                      Check model size
                    </Button>
                  )}
                  {!ready && !active && (
                    <Button
                      variant="outline"
                      disabled={pending}
                      onClick={() =>
                        void run(() => dispatchStudioCommand({ type: 'storage.choose' }))
                      }
                    >
                      Change model folder
                    </Button>
                  )}
                  {canPause && job?.phase !== 'stopping' && (
                    <Button
                      variant="outline"
                      disabled={pending}
                      onClick={() =>
                        void run(() =>
                          dispatchStudioCommand({
                            type: 'model.pause',
                            id: preparedModel,
                            paused: !job?.paused
                          })
                        )
                      }
                    >
                      {job?.paused ? 'Resume download' : 'Pause download'}
                    </Button>
                  )}
                  {ready ? (
                    <Button disabled={pending || active} onClick={() => setStep(3)}>
                      Continue
                    </Button>
                  ) : (
                    !active && (
                      <Button
                        disabled={pending}
                        onClick={() =>
                          void run(() =>
                            dispatchStudioCommand({ type: 'model.download', id: preparedModel })
                          )
                        }
                      >
                        {job?.kind === 'download' && job.phase === 'error'
                          ? 'Retry download'
                          : snapshot.setup.resuming
                            ? 'Download or resume'
                            : 'Download model'}
                      </Button>
                    )
                  )}
                </div>
              </div>
            </>
          )}

          {step === 3 && (
            <>
              <p className="text-sm leading-relaxed text-muted-foreground">
                Generate a short sample with the default voice to check that speech generation
                works.
              </p>
              {previewRequested && job?.kind === 'preview' && !preview && (
                <JobStatus job={job} compact />
              )}
              {preview && (
                <div className="flex flex-wrap items-center justify-between gap-3 border-y border-card-edge py-4">
                  <p className="text-sm font-medium" role="status">
                    Test clip ready
                  </p>
                  <Button
                    variant="outline"
                    disabled={pending}
                    onClick={() =>
                      void act('Play test clip', { type: 'playback.toggle', id: preview.id })
                    }
                  >
                    {snapshot?.playback.playing && snapshot.playback.outputId === preview.id
                      ? 'Pause test clip'
                      : 'Play test clip'}
                  </Button>
                </div>
              )}
              <div className="flex flex-wrap justify-between gap-2">
                <Button
                  variant="ghost"
                  disabled={pending || active}
                  onClick={() => {
                    setPreviewRequested(false)
                    setStep(2)
                  }}
                >
                  Back
                </Button>
                <div className="flex flex-wrap gap-2">
                  {!preview &&
                    previewRequested &&
                    job?.phase === 'error' &&
                    snapshot?.device.label !== 'CPU' && (
                      <Button
                        variant="outline"
                        disabled={pending}
                        onClick={() => void run(() => generateTest(true))}
                      >
                        Try CPU
                      </Button>
                    )}
                  {preview ? (
                    <Button
                      disabled={pending}
                      onClick={() =>
                        void run(async () => {
                          navigate('/narrate', { replace: true })
                          await dispatchStudioCommand({ type: 'setup.finish', id: preview.id })
                        })
                      }
                    >
                      Open Studio
                    </Button>
                  ) : (
                    <Button
                      disabled={pending || active}
                      onClick={() => void run(() => generateTest())}
                    >
                      {previewRequested ? 'Retry test clip' : 'Generate test clip'}
                    </Button>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </section>
    </div>
  )
}
