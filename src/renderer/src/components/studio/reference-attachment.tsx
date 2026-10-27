import { AudioLines, Mic, Upload, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Spinner } from '@/components/ui/spinner'
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
            <AudioLines className="size-5 text-muted-foreground" aria-hidden="true" />
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
            <X aria-hidden="true" />
          </Button>
        </div>
      )}
      {(reference.status === 'error' || reference.status === 'missing') && (
        <Alert variant="destructive">
          <AlertTitle>Reference needs attention</AlertTitle>
          <AlertDescription>{reference.message}</AlertDescription>
        </Alert>
      )}
      <div className="flex flex-wrap gap-2">
        <Button
          variant="outline"
          size="sm"
          disabled={busy}
          onClick={() => act('Upload reference', { type: 'reference.attach', source: 'upload' })}
        >
          <Upload data-icon="inline-start" aria-hidden="true" />
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
          <Mic data-icon="inline-start" aria-hidden="true" />
          {reference.status === 'recording' ? 'Finish recording' : 'Record'}
        </Button>
      </div>
    </section>
  )
}
