import { HugeiconsIcon } from '@hugeicons/react'
import { AudioLinesIcon, MicIcon, UploadIcon, XIcon } from '@hugeicons/core-free-icons'
import { Button } from '@phonivra/ui/components/button'
import { Badge } from '@phonivra/ui/components/badge'
import { Spinner } from '@phonivra/ui/components/spinner'
import { act } from '@/lib/actions'
import type { ReferenceState } from '../../../../shared/studio'

export function ReferenceAttachment({
  reference
}: {
  reference: ReferenceState
}): React.JSX.Element {
  const busy = reference.status === 'validating' || reference.status === 'recording'
  return (
    <section aria-label="Reference recording" className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-4">
        <h3 className="text-sm font-medium">Reference recording</h3>
        {reference.status === 'ready' && <Badge variant="secondary">Overrides preset</Badge>}
      </div>
      {reference.status === 'empty' ? (
        <p className="text-sm text-muted-foreground">
          Use the selected voice, or attach a clean recording. 6+ seconds recommended.
        </p>
      ) : (
        <div className="flex items-center gap-3">
          {busy ? (
            <Spinner aria-label={reference.status} />
          ) : (
            <HugeiconsIcon
              icon={AudioLinesIcon}
              className="size-5 text-muted-foreground"
              aria-hidden="true"
            />
          )}
          <div className="min-w-0 flex-1">
            <p className="break-words text-sm font-medium">{reference.name}</p>
            <p className="text-xs text-muted-foreground">
              {busy
                ? reference.status === 'recording'
                  ? 'Recording simulated reference…'
                  : 'Checking audio…'
                : `${reference.duration.toFixed(1)} seconds`}
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Clear reference recording"
            onClick={() => act('Clear reference', { type: 'reference.clear' })}
          >
            <HugeiconsIcon icon={XIcon} aria-hidden="true" />
          </Button>
        </div>
      )}
      {(reference.status === 'error' || reference.status === 'missing') && (
        <div role="alert" className="flex flex-col gap-1 text-sm text-destructive">
          <p className="font-medium">Reference needs attention</p>
          <div className="leading-relaxed">{reference.message}</div>
        </div>
      )}
      <div className="flex flex-wrap gap-2">
        <Button
          variant="outline"
          size="sm"
          disabled={busy}
          onClick={() => act('Upload reference', { type: 'reference.attach', source: 'upload' })}
        >
          <HugeiconsIcon icon={UploadIcon} data-icon="inline-start" aria-hidden="true" />
          Upload audio
        </Button>
        <Button
          variant="outline"
          size="sm"
          disabled={reference.status === 'validating'}
          onClick={() =>
            act(reference.status === 'recording' ? 'Finish recording' : 'Record reference', {
              type: 'reference.attach',
              source: reference.status === 'recording' ? 'upload' : 'record'
            })
          }
        >
          <HugeiconsIcon icon={MicIcon} data-icon="inline-start" aria-hidden="true" />
          {reference.status === 'recording' ? 'Finish recording' : 'Record'}
        </Button>
      </div>
    </section>
  )
}
