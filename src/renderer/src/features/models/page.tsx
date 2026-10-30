import { useState } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  BoxesIcon,
  DownloadIcon,
  FolderOpenIcon,
  PauseIcon,
  PlayIcon,
  RefreshCwIcon,
  SquareIcon
} from '@hugeicons/core-free-icons'
import { Link } from 'react-router'
import { ScreenFrame, ScreenLoading, DetailValue } from '@/components/studio/screen-frame'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger
} from '@/components/ui/accordion'
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemTitle
} from '@/components/ui/item'
import { ConfirmDelete } from '@/components/studio/confirm-delete'
import { JobStatus, activePhases } from '@/components/studio/job-status'
import { useStudioStore } from '@/stores/studio-store'
import { act, updateSettings } from '@/lib/actions'
import { notify } from '@/lib/notify'
import { languages, models, numericSettings } from '../../../../shared/data/catalog'
import type { ModelId, SamplingKey } from '../../../../shared/studio'

export default function ModelsPage(): React.JSX.Element {
  const snapshot = useStudioStore((state) => state.snapshot)
  const [selected, setSelected] = useState<ModelId>('turbo')
  if (!snapshot) return <ScreenLoading />
  const model = models.find((item) => item.id === selected) ?? models[1]
  const active = activePhases.has(snapshot.job.phase)
  const installedCount = snapshot.models.filter(
    (item) => item.status === 'installed' || item.status === 'active'
  ).length
  return (
    <ScreenFrame
      title="Speech models"
      description={
        <>
          Find the <span className="highlight">Right fit for your voice.</span> Choose a model for
          your language and device.
        </>
      }
    >
      {!snapshot.dependencies.online && (
        <p role="status" className="text-sm text-muted-foreground">
          You are offline. Installed models remain usable; connect to download another model.
        </p>
      )}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <p className="text-sm text-muted-foreground">
          {installedCount} installed · one model loaded at a time
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link
              to="/settings?tab=storage"
              onClick={() => notify('Model storage settings clicked')}
            >
              <HugeiconsIcon icon={FolderOpenIcon} data-icon="inline-start" aria-hidden="true" />
              Storage settings
            </Link>
          </Button>
          <Button
            variant={snapshot.settings.model === 'auto' ? 'secondary' : 'outline'}
            size="sm"
            onClick={() => updateSettings('model', 'auto')}
          >
            Use Auto routing
          </Button>
        </div>
      </div>
      <p className="text-sm leading-relaxed text-muted-foreground">
        Auto uses Turbo for English and Multilingual V3 for other supported languages. It has no
        files to download.
      </p>
      <ItemGroup className="grid gap-4 lg:grid-cols-2">
        {models
          .filter((item) => item.downloadable)
          .map((item) => {
            const id = item.id as Exclude<ModelId, 'auto'>
            const installation = snapshot.models.find((entry) => entry.id === id)
            const downloading =
              installation?.status === 'downloading' || installation?.status === 'paused'
            const available =
              installation?.status === 'installed' || installation?.status === 'active'
            return (
              <Item
                key={id}
                variant="outline"
                className="relative flex-col items-stretch gap-5 card-chai p-6"
              >
                <Button
                  variant="link"
                  className="absolute inset-0 z-10 h-full w-full rounded-xl"
                  aria-label={`Show ${item.label} details`}
                  aria-pressed={selected === id}
                  onClick={() => {
                    setSelected(id)
                    notify('Model details clicked')
                  }}
                />
                <div className="flex size-10 items-center justify-center rounded-xl bg-secondary text-secondary-foreground">
                  <HugeiconsIcon icon={BoxesIcon} className="size-5" aria-hidden="true" />
                </div>
                <ItemContent>
                  <ItemTitle>
                    {item.label}
                    {selected === id && <Badge variant="secondary">Details shown</Badge>}
                    {snapshot.settings.model === id && <Badge variant="secondary">Selected</Badge>}
                    <Badge variant={installation?.status === 'error' ? 'destructive' : 'outline'}>
                      {installation?.status ?? 'not-installed'}
                    </Badge>
                  </ItemTitle>
                  <ItemDescription>{item.description}</ItemDescription>
                  <p className="text-xs text-muted-foreground">
                    {item.parameters} ·{' '}
                    {item.languages.length === 1
                      ? 'English only'
                      : `${item.languages.length} languages`}
                    {installation?.bytes
                      ? ` · ${(installation.bytes / 1000000000).toFixed(2)} GB cached`
                      : ' · download size unavailable'}
                  </p>
                  {downloading && (
                    <div className="mt-3 flex flex-col gap-2">
                      <Progress
                        value={installation.progress}
                        aria-label={`${item.label} download progress`}
                      />
                      <p className="text-xs tabular-nums text-muted-foreground">
                        {installation.progress}% ·{' '}
                        {installation.status === 'paused' ? 'Paused' : 'Downloading'}
                      </p>
                    </div>
                  )}
                  {installation?.message && (
                    <p className="text-sm text-destructive">{installation.message}</p>
                  )}
                </ItemContent>
                <ItemActions className="relative z-20 mt-auto flex-wrap">
                  {downloading ? (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={snapshot.job.kind !== 'download'}
                        onClick={() =>
                          act(
                            installation.status === 'paused'
                              ? 'Resume model download'
                              : 'Pause model download',
                            { type: 'model.pause', id, paused: installation.status !== 'paused' }
                          )
                        }
                      >
                        {installation.status === 'paused' ? (
                          <HugeiconsIcon
                            icon={PlayIcon}
                            data-icon="inline-start"
                            aria-hidden="true"
                          />
                        ) : (
                          <HugeiconsIcon
                            icon={PauseIcon}
                            data-icon="inline-start"
                            aria-hidden="true"
                          />
                        )}
                        {installation.status === 'paused' ? 'Resume' : 'Pause'}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => act('Cancel model download', { type: 'job.cancel' })}
                      >
                        <HugeiconsIcon
                          icon={SquareIcon}
                          data-icon="inline-start"
                          aria-hidden="true"
                        />
                        Cancel
                      </Button>
                    </>
                  ) : available ? (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={snapshot.settings.model === id}
                        onClick={() => updateSettings('model', id)}
                      >
                        Use model
                      </Button>
                      <ConfirmDelete
                        name={item.label}
                        description="Remove this model’s local download. Existing narrations are kept; shared cache files may be retained."
                        disabled={active}
                        onConfirm={() =>
                          act('Remove model', { type: 'model.remove', id, confirmed: true })
                        }
                      />
                    </>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={active || !snapshot.dependencies.online}
                      onClick={() =>
                        act(
                          installation?.status === 'error'
                            ? 'Retry model download'
                            : 'Download model',
                          { type: 'model.download', id }
                        )
                      }
                    >
                      {installation?.status === 'error' ? (
                        <HugeiconsIcon
                          icon={RefreshCwIcon}
                          data-icon="inline-start"
                          aria-hidden="true"
                        />
                      ) : (
                        <HugeiconsIcon
                          icon={DownloadIcon}
                          data-icon="inline-start"
                          aria-hidden="true"
                        />
                      )}
                      {installation?.status === 'error' ? 'Retry download' : 'Download'}
                    </Button>
                  )}
                </ItemActions>
              </Item>
            )
          })}
      </ItemGroup>
      {active && (
        <>
          <Separator />
          <JobStatus job={snapshot.job} />
        </>
      )}
      <Separator />
      <section
        aria-labelledby="model-details-heading"
        className="flex flex-col gap-6 card-chai p-6"
      >
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h2 id="model-details-heading" className="text-lg font-semibold">
            {model.label}
          </h2>
          <p className="text-xs text-muted-foreground">
            {snapshot.device.label}
            {snapshot.device.vram && ` · ${snapshot.device.vram}`}
          </p>
        </div>
        <dl className="grid grid-cols-2 gap-6 lg:grid-cols-4">
          <DetailValue label="Parameters">{model.parameters}</DetailValue>
          <DetailValue label="Languages">
            {model.languages.length === 1 ? 'English' : `${model.languages.length} supported`}
          </DetailValue>
          <DetailValue label="Reference minimum">
            {model.referenceStrict ? 'More than' : 'At least'} {model.referenceMinimum}s; 6+s
            recommended
          </DetailValue>
          <DetailValue label="Speech per part">Up to {model.maxSpeechTokens} tokens</DetailValue>
          <DetailValue label="CUDA precision">
            {model.cudaPrecision === 'half' ? 'Half precision T3' : 'Full precision'}
          </DetailValue>
          <DetailValue label="Native reactions">
            {model.reactions ? 'Supported' : 'Not supported'}
          </DetailValue>
          <DetailValue label="Speech conditioning">First {model.conditioningSeconds}s</DetailValue>
          <DetailValue label="Source">{model.repository ?? 'Automatic router'}</DetailValue>
        </dl>
        <Accordion type="multiple">
          <AccordionItem value="controls">
            <AccordionTrigger>Supported generation controls</AccordionTrigger>
            <AccordionContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Control</TableHead>
                    <TableHead>Support</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {numericSettings
                    .filter((field) => field.group === 'sampling' && field.key !== 'seed')
                    .map((field) => (
                      <TableRow key={field.key}>
                        <TableCell>{field.label}</TableCell>
                        <TableCell>
                          {model.sampling.includes(field.key as SamplingKey)
                            ? 'Supported'
                            : 'Not used by this model'}
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="languages">
            <AccordionTrigger>Languages and processing notes</AccordionTrigger>
            <AccordionContent>
              <div className="grid gap-4 md:grid-cols-2">
                {languages
                  .filter((language) => model.languages.includes(language.code))
                  .map((language) => (
                    <div key={language.code}>
                      <p className="text-sm font-medium">
                        {language.label}{' '}
                        <span lang={language.code} className="font-normal text-muted-foreground">
                          {language.nativeLabel}
                        </span>
                      </p>
                      {language.note && (
                        <p className="mt-1 text-xs text-muted-foreground">{language.note}</p>
                      )}
                    </div>
                  ))}
              </div>
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="limits">
            <AccordionTrigger>Output and runtime limits</AccordionTrigger>
            <AccordionContent>
              <p className="text-sm leading-relaxed text-muted-foreground">
                Current models output mono 24 kHz audio with the Resemble Perth watermark. The
                1000-token cap is roughly 40 seconds of speech per part. CPU inference uses full
                precision. Switching models releases the previous one. Precision, quantization, GPU
                index and MPS controls are not available.
              </p>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </section>
      {import.meta.env.DEV && (
        <p className="text-xs text-muted-foreground">
          New, needs backend work: download progress, pause/resume, installed-model management.
          Sizes and lifecycle actions are mock data. License and gated-access requirements remain
          open product decisions.
        </p>
      )}
    </ScreenFrame>
  )
}
