import { useState } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  CopyIcon,
  FolderOpenIcon,
  HardDriveIcon,
  KeyRoundIcon,
  RefreshCwIcon,
  RotateCcwIcon,
  SaveIcon
} from '@hugeicons/core-free-icons'
import { Link, useSearchParams } from 'react-router'
import { ScreenFrame, ScreenLoading, DetailValue } from '@/components/studio/screen-frame'
import { Button } from '@phonivra/ui/components/button'
import { Badge } from '@phonivra/ui/components/badge'
import { Input } from '@phonivra/ui/components/input'
import { Field, FieldDescription, FieldGroup, FieldLabel } from '@phonivra/ui/components/field'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@phonivra/ui/components/tabs'
import { ToggleGroup, ToggleGroupItem } from '@phonivra/ui/components/toggle-group'
import { Separator } from '@phonivra/ui/components/separator'
import { ScrollArea } from '@phonivra/ui/components/scroll-area'
import { CatalogSelect } from '@/components/studio/catalog-select'
import { EssentialSettings, AdvancedSettings } from '@/components/studio/settings-fields'
import { DictionaryEditor } from '@/components/studio/dictionary-editor'
import { RestoreDefaults } from '@/components/studio/restore-defaults'
import { ConfirmDelete } from '@/components/studio/confirm-delete'
import { activePhases } from '@/components/studio/job-status'
import { useTheme } from '@/hooks/use-theme'
import { useStudioStore } from '@/stores/studio-store'
import { act } from '@/lib/actions'
import { notify } from '@/lib/notify'
import type { Theme } from '../../../../shared/api'
import type { GenerationSettings } from '../../../../shared/studio'

export function SettingsPage(): React.JSX.Element {
  const snapshot = useStudioStore((state) => state.snapshot)
  const { theme, setTheme } = useTheme()
  const [token, setToken] = useState('')
  const [searchParams, setSearchParams] = useSearchParams()
  const requestedTab = searchParams.get('tab')
  const tab =
    requestedTab === 'generation' || requestedTab === 'storage' || requestedTab === 'diagnostics'
      ? requestedTab
      : 'general'
  if (!snapshot) return <ScreenLoading />
  const preferences = snapshot.configuration.preferences
  const dirty = Object.entries(snapshot.settings).some(
    ([key, value]) => snapshot.configuration.saved[key as keyof GenerationSettings] !== value
  )
  const active = activePhases.has(snapshot.job.phase)
  async function connectCredential(): Promise<void> {
    await act('Connect download credential', { type: 'credentials.set', token })
    setToken('')
  }
  return (
    <ScreenFrame
      title="Settings"
      description={
        <>
          Make this studio <span className="highlight">Feel like yours.</span> Set your defaults,
          appearance and local resources.
        </>
      }
    >
      <Tabs
        value={tab}
        onValueChange={(value) => {
          setSearchParams(
            (current) => {
              const next = new URLSearchParams(current)
              next.set('tab', value)
              return next
            },
            { replace: true }
          )
          notify('Settings tab clicked')
        }}
      >
        <TabsList variant="line" className="mb-6 flex h-auto flex-wrap justify-start gap-5">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="generation">Generation</TabsTrigger>
          <TabsTrigger value="storage">Storage and downloads</TabsTrigger>
          <TabsTrigger value="diagnostics">Diagnostics</TabsTrigger>
        </TabsList>
        <TabsContent value="general">
          <div className="flex max-w-4xl flex-col gap-8 card-chai p-6 lg:p-8">
            <section className="flex flex-col gap-4" aria-labelledby="appearance-heading">
              <h2 id="appearance-heading" className="text-base font-semibold">
                Appearance
              </h2>
              <FieldGroup>
                <Field>
                  <FieldLabel id="appearance-label">Theme</FieldLabel>
                  <ToggleGroup
                    type="single"
                    variant="outline"
                    value={theme}
                    aria-labelledby="appearance-label"
                    onValueChange={(value) => {
                      if (value) {
                        notify('Theme selection clicked')
                        void setTheme(value as Theme)
                      }
                    }}
                  >
                    <ToggleGroupItem value="light">Light</ToggleGroupItem>
                    <ToggleGroupItem value="dark">Dark</ToggleGroupItem>
                    <ToggleGroupItem value="system">System</ToggleGroupItem>
                  </ToggleGroup>
                  <FieldDescription>
                    System follows the device’s appearance. The desktop window and dialogs stay in
                    sync.
                  </FieldDescription>
                </Field>
              </FieldGroup>
            </section>
            <Separator />
            <section className="flex flex-col gap-4" aria-labelledby="device-heading">
              <h2 id="device-heading" className="text-base font-semibold">
                Generation device
              </h2>
              <FieldGroup>
                <CatalogSelect
                  label="Preferred device"
                  value={snapshot.device.mode}
                  disabled={active}
                  options={[
                    {
                      value: 'auto',
                      label: 'Auto',
                      description: 'CUDA when available; otherwise CPU'
                    },
                    { value: 'cpu', label: 'CPU', description: 'Available without an NVIDIA GPU' },
                    {
                      value: 'cuda',
                      label: 'NVIDIA CUDA',
                      description: 'Requires a compatible GPU and driver'
                    }
                  ]}
                  onChange={(mode) =>
                    act('Change generation device', {
                      type: 'device.set',
                      mode: mode as 'auto' | 'cpu' | 'cuda'
                    })
                  }
                />
              </FieldGroup>
              <dl className="grid grid-cols-2 gap-4">
                <DetailValue label="Active device">{snapshot.device.label}</DetailValue>
                <DetailValue label="GPU memory">
                  {snapshot.device.vram ?? 'Not available on CPU'}
                </DetailValue>
              </dl>
              {active && (
                <p className="text-xs text-muted-foreground">
                  Stop the current job before changing the device.
                </p>
              )}
              <p className="text-sm text-muted-foreground">
                CPU generation is supported and may take longer for large scripts. Only one model
                and one generation job run at a time.
              </p>
              <p className="text-xs text-muted-foreground">
                MPS, GPU index, precision and quantization controls are not available.
              </p>
            </section>
            <Separator />
            <section className="flex flex-col gap-3">
              <h2 className="text-base font-semibold">Local by design</h2>
              <p className="text-sm leading-relaxed text-muted-foreground">
                No account, cloud storage or telemetry. Model downloads need a network connection;
                installed models can generate offline. Audio includes the Resemble Perth watermark.
              </p>
            </section>
          </div>
        </TabsContent>
        <TabsContent value="generation">
          <div className="flex max-w-4xl flex-col gap-6 card-chai p-6 lg:p-8">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-col gap-1">
                <h2 className="text-base font-semibold">Generation defaults</h2>
                <p className="text-sm text-muted-foreground">
                  These are also the current shared settings for Narrate and Batch.
                </p>
              </div>
              <Badge variant={dirty ? 'secondary' : 'outline'}>
                {dirty ? 'Unsaved changes' : 'Saved values'}
              </Badge>
            </div>
            <EssentialSettings />
            <Separator />
            <AdvancedSettings />
            <DictionaryEditor />
            <Separator />
            <div className="flex flex-wrap gap-3">
              <Button
                disabled={!dirty}
                onClick={() => act('Save generation defaults', { type: 'preferences.save' })}
              >
                <HugeiconsIcon icon={SaveIcon} data-icon="inline-start" aria-hidden="true" />
                Save defaults
              </Button>
              <RestoreDefaults>
                <Button variant="outline">
                  <HugeiconsIcon icon={RotateCcwIcon} data-icon="inline-start" aria-hidden="true" />
                  Restore factory defaults
                </Button>
              </RestoreDefaults>
            </div>
            <p className="text-xs leading-relaxed text-muted-foreground">
              Factory defaults reset all 28 generation settings, including title, voice, language
              and output format. The script, dictionary and attached reference are kept. The
              dictionary has its own Save action.
            </p>
            <p className="text-xs text-muted-foreground">
              Current values and saved values may differ. Generating or saving a project also saves
              the generation settings.
            </p>
          </div>
        </TabsContent>
        <TabsContent value="storage">
          <div className="flex max-w-4xl flex-col gap-8 card-chai p-6 lg:p-8">
            <section aria-labelledby="model-storage-heading" className="flex flex-col gap-4">
              <div className="flex items-center gap-2">
                <HugeiconsIcon
                  icon={HardDriveIcon}
                  className="size-4 text-muted-foreground"
                  aria-hidden="true"
                />
                <h2 id="model-storage-heading" className="text-base font-semibold">
                  Model storage
                </h2>
              </div>
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="cache-path">Model cache folder</FieldLabel>
                  <Input id="cache-path" value={preferences.cachePath} readOnly />
                  <FieldDescription>
                    Downloaded model files are kept here for offline use.
                  </FieldDescription>
                </Field>
              </FieldGroup>
              <div className="flex flex-wrap gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={active}
                  onClick={() => act('Choose model cache folder', { type: 'storage.choose' })}
                >
                  Choose folder
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => act('Open model cache folder', { type: 'storage.open' })}
                >
                  <HugeiconsIcon
                    icon={FolderOpenIcon}
                    data-icon="inline-start"
                    aria-hidden="true"
                  />
                  Open folder
                </Button>
                <Button size="sm" variant="link" asChild>
                  <Link to="/models" onClick={() => notify('Manage downloaded models clicked')}>
                    Manage installed models
                  </Link>
                </Button>
              </div>
            </section>
            <Separator />
            <section aria-labelledby="credential-heading" className="flex flex-col gap-4">
              <div className="flex items-center gap-2">
                <HugeiconsIcon
                  icon={KeyRoundIcon}
                  className="size-4 text-muted-foreground"
                  aria-hidden="true"
                />
                <h2 id="credential-heading" className="text-base font-semibold">
                  Hugging Face access
                </h2>
                <Badge variant="outline">
                  {preferences.tokenConfigured ? 'Configured' : 'Optional'}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                Public model downloads usually work without a token. A token may be needed for
                account-specific access.
              </p>
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="download-token">Access token</FieldLabel>
                  <Input
                    id="download-token"
                    type="password"
                    autoComplete="off"
                    value={token}
                    maxLength={4096}
                    placeholder={
                      preferences.tokenConfigured
                        ? 'Token configured; value hidden'
                        : 'Enter a download token'
                    }
                    onChange={(event) => setToken(event.target.value)}
                  />
                  <FieldDescription>
                    Tokens are never included in projects, diagnostics or generation metadata.
                  </FieldDescription>
                </Field>
              </FieldGroup>
              <div className="flex flex-wrap gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={!token.trim()}
                  onClick={() => void connectCredential()}
                >
                  Connect token
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  disabled={!preferences.tokenConfigured}
                  onClick={() => act('Remove download credential', { type: 'credentials.remove' })}
                >
                  Remove token
                </Button>
              </div>
              {import.meta.env.DEV && (
                <p className="text-xs text-muted-foreground">
                  Mock credential setup: submitted text is discarded. Secure credential storage
                  needs backend work.
                </p>
              )}
            </section>
            <Separator />
            <section aria-labelledby="preview-storage-heading" className="flex flex-col gap-4">
              <h2 id="preview-storage-heading" className="text-base font-semibold">
                Temporary voice previews
              </h2>
              <p className="text-sm text-muted-foreground">
                {(preferences.previewBytes / 1000000).toFixed(1)} MB of preview audio. Previews are
                separate from saved narrations.
              </p>
              <div>
                <ConfirmDelete
                  name="temporary voice previews"
                  description="Remove generated preview audio. Saved voice presets and Library narrations are kept."
                  disabled={active || !preferences.previewBytes}
                  onConfirm={() => act('Clear temporary previews', { type: 'previews.clear' })}
                />
              </div>
              <p className="text-xs text-muted-foreground">Automatic retention is not enabled.</p>
            </section>
          </div>
        </TabsContent>
        <TabsContent value="diagnostics">
          <div className="flex max-w-4xl flex-col gap-6 card-chai p-6 lg:p-8">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <h2 className="text-base font-semibold">Local diagnostics</h2>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => act('Refresh diagnostics', { type: 'diagnostics.refresh' })}
                >
                  <HugeiconsIcon icon={RefreshCwIcon} data-icon="inline-start" aria-hidden="true" />
                  Refresh
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => act('Copy diagnostics', { type: 'diagnostics.copy' })}
                >
                  <HugeiconsIcon icon={CopyIcon} data-icon="inline-start" aria-hidden="true" />
                  Copy
                </Button>
              </div>
            </div>
            <dl className="grid grid-cols-2 gap-6">
              <DetailValue label="Device">{snapshot.device.label}</DetailValue>
              <DetailValue label="GPU memory">{snapshot.device.vram ?? 'Unavailable'}</DetailValue>
              <DetailValue label="FFmpeg">
                {snapshot.dependencies.ffmpeg ? 'Available' : 'Unavailable'}
              </DetailValue>
              <DetailValue label="Perth detector">
                {snapshot.dependencies.perth ? 'Available' : 'Unavailable'}
              </DetailValue>
              <DetailValue label="Network">
                {snapshot.dependencies.online ? 'Online' : 'Offline'}
              </DetailValue>
              <DetailValue label="Current job">{snapshot.job.phase}</DetailValue>
              <DetailValue label="Loaded models">
                {snapshot.models.filter((model) => model.status === 'active').length} of 1
              </DetailValue>
              <DetailValue label="CPU thread policy">Up to 6 threads</DetailValue>
            </dl>
            {!snapshot.dependencies.ffmpeg && (
              <div role="alert" className="flex flex-col gap-1 text-sm text-destructive">
                <p className="font-medium">FFmpeg unavailable</p>
                <div className="leading-relaxed">
                  ffmpeg is required for this output format or sample rate. Native 24 kHz WAV at 1×
                  speed remains available.
                </div>
              </div>
            )}
            <Separator />
            <h3 className="text-sm font-medium">Recent activity</h3>
            <ScrollArea className="h-48">
              <div role="log" aria-label="Diagnostic log" className="flex flex-col gap-3 pr-4">
                {preferences.logs.map((line, index) => (
                  <p key={`${index}-${line}`} className="break-words text-sm text-muted-foreground">
                    {line}
                  </p>
                ))}
              </div>
            </ScrollArea>
            <Button
              variant="outline"
              size="sm"
              className="self-start"
              onClick={() => act('Open logs folder', { type: 'logs.open' })}
            >
              <HugeiconsIcon icon={FolderOpenIcon} data-icon="inline-start" aria-hidden="true" />
              Open logs
            </Button>
            <p className="text-xs leading-relaxed text-muted-foreground">
              Jobs are held in memory. Restarting loses unfinished work. No remote reporting or
              dedicated health endpoint is enabled.
            </p>
          </div>
        </TabsContent>
      </Tabs>
      {import.meta.env.DEV && (
        <p className="text-xs text-muted-foreground">
          Device, storage, credentials and diagnostics use the mock API. Appearance is persisted by
          the existing desktop theme service.
        </p>
      )}
    </ScreenFrame>
  )
}
