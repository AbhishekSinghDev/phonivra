import { useEffect, useState } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  DownloadIcon,
  FileTextIcon,
  FolderOpenIcon,
  ShieldCheckIcon
} from '@hugeicons/core-free-icons'
import { Button } from '@phonivra/ui/components/button'
import { Badge } from '@phonivra/ui/components/badge'
import { Separator } from '@phonivra/ui/components/separator'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger
} from '@phonivra/ui/components/accordion'
import { AudioTransport } from './audio-transport'
import { ConfirmDelete } from './confirm-delete'
import { WindowedList } from './windowed-list'
import { act } from '@/lib/actions'
import { languages, models, settingLabels } from '../../../../shared/data/catalog'
import { Table, TableBody, TableCell, TableRow } from '@phonivra/ui/components/table'
import { formatTime } from './job-status'
import type { GenerationSettings, OutputDetailsData, OutputRecord } from '../../../../shared/studio'

export function OutputDetails({
  output,
  showManagement = true,
  exportVariant = 'default'
}: {
  output: OutputRecord
  showManagement?: boolean
  exportVariant?: 'default' | 'outline'
}): React.JSX.Element {
  const [sections, setSections] = useState<string[]>([])
  const [attempt, setAttempt] = useState(0)
  const [result, setResult] = useState<{
    output: OutputRecord
    attempt: number
    data: OutputDetailsData | null
  } | null>(null)
  const details = result?.output === output && result.attempt === attempt ? result : null
  const wantsDetails =
    (output.partCount > 0 && sections.includes('parts')) ||
    (output.hasSettingsSnapshot && sections.includes('settings-used'))

  useEffect(() => {
    if (!wantsDetails || details) return
    let active = true
    void window.api.studio.outputDetails(output.id).then(
      (data) => {
        if (active) setResult({ output, attempt, data })
      },
      () => {
        if (active) setResult({ output, attempt, data: null })
      }
    )
    return () => {
      active = false
    }
  }, [output, wantsDetails, details, attempt])

  const detailStatus = details ? (
    <div className="flex items-center gap-3" role="status">
      Could not load generation details.
      <Button size="sm" variant="outline" onClick={() => setAttempt(attempt + 1)}>
        Retry
      </Button>
    </div>
  ) : (
    <p role="status" className="text-muted-foreground">
      Loading generation details…
    </p>
  )

  return (
    <div className="flex min-w-0 flex-col gap-6">
      <AudioTransport id={output.id} title={output.title} duration={output.duration} />
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="secondary">{output.format.toUpperCase()}</Badge>
        <Badge variant="outline">{output.sampleRate / 1000} kHz · mono</Badge>
        <Badge variant="outline">
          {output.external || !output.metadataAvailable
            ? 'Watermark unverified'
            : 'Perth watermarked'}
        </Badge>
        {output.external && <Badge variant="outline">External recording</Badge>}
      </div>
      <div className="flex flex-wrap gap-2">
        <Button
          size="sm"
          variant={exportVariant}
          onClick={() =>
            act('Save audio', { type: 'output.export', id: output.id, format: 'audio' })
          }
        >
          <HugeiconsIcon icon={DownloadIcon} data-icon="inline-start" aria-hidden="true" />
          Save audio
        </Button>
        {output.companions.map((format) => (
          <Button
            key={format}
            size="sm"
            variant="outline"
            onClick={() =>
              act(`Save ${format.toUpperCase()}`, { type: 'output.export', id: output.id, format })
            }
          >
            <HugeiconsIcon icon={FileTextIcon} data-icon="inline-start" aria-hidden="true" />
            {format.toUpperCase()}
          </Button>
        ))}
      </div>
      <Separator />
      {!output.metadataAvailable && (
        <p className="text-sm leading-relaxed text-muted-foreground">
          Generation metadata is unavailable. The audio can still be played and exported; details
          are not inferred from its filename.
        </p>
      )}
      <Accordion type="multiple" value={sections} onValueChange={setSections}>
        <AccordionItem value="details">
          <AccordionTrigger>Generation details</AccordionTrigger>
          <AccordionContent>
            <dl className="grid grid-cols-2 gap-x-6 gap-y-4 text-sm">
              {[
                [
                  'Requested model',
                  models.find((model) => model.id === output.requestedModel)?.label ?? 'Unavailable'
                ],
                [
                  'Resolved model',
                  models.find((model) => model.id === output.model)?.label ?? 'Unavailable'
                ],
                ...(output.backend
                  ? [
                      [
                        'Generation device',
                        output.backend === 'directml' ? 'DirectML' : output.backend.toUpperCase()
                      ]
                    ]
                  : []),
                [
                  'Language',
                  languages.find((language) => language.code === output.language)?.label ??
                    'Unavailable'
                ],
                ['Duration', formatTime(output.duration)],
                [
                  'Source characters',
                  output.metadataAvailable
                    ? (output.sourceCharacters ?? 'Unavailable')
                    : 'Unavailable'
                ],
                [
                  'Speed',
                  output.metadataAvailable && output.speed !== null
                    ? `${output.speed}×`
                    : 'Unavailable'
                ],
                [
                  'Trimmed start',
                  output.metadataAvailable && output.trimStart !== null
                    ? `${output.trimStart}s`
                    : 'Unavailable'
                ],
                ['Voice', output.voice ?? 'Unavailable'],
                ['Seed', output.seed ?? 'Unavailable'],
                [
                  'Loudness gain',
                  output.loudnessGain === null ? 'Unavailable' : `${output.loudnessGain} dB`
                ],
                ['Parts', output.partCount]
              ].map(([label, value]) => (
                <div key={String(label)}>
                  <dt className="text-muted-foreground">{label}</dt>
                  <dd className="mt-1 break-words font-medium">{value}</dd>
                </div>
              ))}
            </dl>
            <div className="mt-4 flex flex-col gap-2 text-xs text-muted-foreground">
              <p className="break-words">{output.filename}</p>
              <p>Created {new Date(output.created).toLocaleString()}</p>
            </div>
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="parts">
          <AccordionTrigger>Part timings ({output.partCount})</AccordionTrigger>
          <AccordionContent>
            {details?.data ? (
              <WindowedList
                items={details.data.parts}
                itemKey={(part) => part.id}
                label="Generated part timings"
                renderItem={(part) => (
                  <div className="flex h-full items-center gap-4 py-2">
                    <span className="w-8 shrink-0 text-xs tabular-nums text-muted-foreground">
                      {part.index}
                    </span>
                    <p className="line-clamp-2 min-w-0 flex-1 text-sm" title={part.text}>
                      {part.text}
                    </p>
                    <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
                      {part.duration.toFixed(1)}s / {part.pause}s pause
                    </span>
                  </div>
                )}
              />
            ) : output.partCount > 0 ? (
              detailStatus
            ) : (
              <p className="text-sm text-muted-foreground">Part timings are unavailable.</p>
            )}
          </AccordionContent>
        </AccordionItem>
        {output.hasSettingsSnapshot && (
          <AccordionItem value="settings-used">
            <AccordionTrigger>Settings used for this take</AccordionTrigger>
            <AccordionContent>
              {details?.data?.settingsSnapshot ? (
                <Table>
                  <TableBody>
                    {Object.entries(details.data.settingsSnapshot).map(([key, value]) => (
                      <TableRow key={key}>
                        <TableCell>{settingLabels[key as keyof GenerationSettings]}</TableCell>
                        <TableCell className="text-right">
                          {typeof value === 'boolean'
                            ? value
                              ? 'On'
                              : 'Off'
                            : String(value) || 'Untitled'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                detailStatus
              )}
            </AccordionContent>
          </AccordionItem>
        )}
        <AccordionItem value="subtitles">
          <AccordionTrigger>About subtitles and transcripts</AccordionTrigger>
          <AccordionContent>
            <p className="text-sm text-muted-foreground">
              SRT and VTT use approximate sentence timing, adjusted for speed and trimmed silence.
              The transcript contains the prepared text. Subtitle editing, translation and word
              alignment are not supported.
            </p>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
      {showManagement && (
        <div className="flex flex-wrap items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => act('Verify watermark', { type: 'output.watermark', id: output.id })}
          >
            <HugeiconsIcon icon={ShieldCheckIcon} data-icon="inline-start" aria-hidden="true" />
            Verify watermark
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => act('Open output folder', { type: 'folder.open' })}
          >
            <HugeiconsIcon icon={FolderOpenIcon} data-icon="inline-start" aria-hidden="true" />
            Open folder
          </Button>
          <ConfirmDelete
            name={output.title}
            description="The audio and its SRT, VTT, TXT and JSON companions will be removed. Other batch items are kept."
            onConfirm={() =>
              act('Delete narration', { type: 'output.delete', id: output.id, confirmed: true })
            }
          />
        </div>
      )}
    </div>
  )
}
