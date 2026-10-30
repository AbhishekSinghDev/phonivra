import { useId, useState } from 'react'
import { Button } from '@phonivra/ui/components/button'
import { Field, FieldDescription, FieldGroup, FieldLabel } from '@phonivra/ui/components/field'
import { Input } from '@phonivra/ui/components/input'
import { ConfirmDelete } from './confirm-delete'
import { act } from '@/lib/actions'
import { useStudioStore } from '@/stores/studio-store'

export function VoicePresetControls({
  showDelete = true
}: { showDelete?: boolean } = {}): React.JSX.Element | null {
  const snapshot = useStudioStore((s) => s.snapshot)
  const [label, setLabel] = useState('')
  const id = useId()
  if (!snapshot) return null
  const selected = snapshot.voices.find((voice) => voice.id === snapshot.settings.voice)
  return (
    <FieldGroup>
      <Field>
        <FieldLabel htmlFor={id}>Preset name</FieldLabel>
        <Input
          id={id}
          value={label}
          placeholder="My voice"
          maxLength={60}
          onChange={(event) => setLabel(event.target.value)}
        />
        <FieldDescription>
          Saved references use mono 24 kHz WAV and are limited to 40 seconds.
        </FieldDescription>
      </Field>
      <div className="flex flex-wrap gap-2">
        <Button
          variant="outline"
          size="sm"
          disabled={snapshot.reference.status !== 'ready'}
          onClick={() => act('Save voice preset', { type: 'voice.save', label })}
        >
          Save as voice preset
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => act('Refresh voices', { type: 'voices.refresh' })}
        >
          Refresh voices
        </Button>
        {showDelete && (
          <ConfirmDelete
            name={selected?.label ?? 'voice'}
            description="Only custom presets saved in Phonivra can be deleted. Built-in presets and externally discovered recordings are protected."
            disabled={selected?.kind !== 'custom'}
            onConfirm={() =>
              act('Delete voice preset', {
                type: 'voice.delete',
                id: snapshot.settings.voice,
                confirmed: true
              })
            }
          />
        )}
      </div>
    </FieldGroup>
  )
}
