import { useState } from 'react'
import { Boxes, Download, FolderOpen, Pause, Play, RefreshCw, Square } from 'lucide-react'
import { Link } from 'react-router'
import { ScreenFrame, ScreenLoading, DetailValue } from '@/components/studio/screen-frame'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
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
      title="Models"
      description="Download and manage the speech models stored on this device."
      actions={
        <Button variant="outline" size="sm" asChild>
          <Link to="/settings" onClick={() => notify('Model storage settings clicked')}>
            <FolderOpen data-icon="inline-start" aria-hidden="true" />
            Storage settings
          </Link>
        </Button>
      }
    >
      {!snapshot.dependencies.online && (
        <Alert>
          <AlertTitle>You are offline</AlertTitle>
          <AlertDescription>
            Installed models remain usable. Connect to download another model.
          </AlertDescription>
        </Alert>
      )}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <p className="text-sm text-muted-foreground">
          {installedCount} installed · one model loaded at a time
        </p>
        <Button
          variant={snapshot.settings.model === 'auto' ? 'secondary' : 'outline'}
          size="sm"
          onClick={() => updateSettings('model', 'auto')}
        >
          Use Auto routing
        </Button>
      </div>
      <Alert>
        <Boxes aria-hidden="true" />
        <AlertTitle>Auto chooses a model for the language</AlertTitle>
        <AlertDescription>
          English uses Turbo. Other supported languages use Multilingual V3. Auto is a routing
          choice and has no files to download.
        </AlertDescription>
      </Alert>
      <ItemGroup>
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
              <Item key={id} className="py-5">
                <ItemContent>
                  <ItemTitle>
                    <Button
                      size="sm"
                      variant="link"
                      onClick={() => {
                        setSelected(id)
                        notify('Model details clicked')
                      }}
                    >
                      {item.label}
                    </Button>
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
                <ItemActions className="flex-wrap">
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
                          <Play data-icon="inline-start" aria-hidden="true" />
                        ) : (
                          <Pause data-icon="inline-start" aria-hidden="true" />
                        )}
                        {installation.status === 'paused' ? 'Resume' : 'Pause'}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => act('Cancel model download', { type: 'job.cancel' })}
                      >
                        <Square data-icon="inline-start" aria-hidden="true" />
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
                        <RefreshCw data-icon="inline-start" aria-hidden="true" />
                      ) : (
                        <Download data-icon="inline-start" aria-hidden="true" />
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
      <section aria-labelledby="model-details-heading" className="flex flex-col gap-6">
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
