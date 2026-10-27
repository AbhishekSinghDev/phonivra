import { useId } from 'react'
import { cn } from 'cn'
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { CatalogSelect } from '@/components/studio/catalog-select'
import { BooleanField } from '@/components/studio/settings-fields'
import { useStudioStore } from '@/stores/studio-store'
import { updateSettings } from '@/lib/actions'
import { languages, models } from '../../../../../shared/data/catalog'
import type { GenerationSettings } from '../../../../../shared/studio'

export function NarrationSetup({
  compact = false
}: {
  compact?: boolean
}): React.JSX.Element | null {
  const settings = useStudioStore((state) => state.snapshot?.settings)
  const voices = useStudioStore((state) => state.snapshot?.voices)
  const id = useId()
  if (!settings || !voices) return null
  return (
    <FieldGroup className="gap-4">
      <FieldGroup className={cn('gap-4', compact && 'grid grid-cols-3')}>
        <CatalogSelect
          label="Voice"
          value={settings.voice}
          options={voices.map((voice) => ({
            value: voice.id,
            label: voice.label,
            description:
              voice.kind === 'custom'
                ? 'Saved voice'
                : voice.kind === 'external'
                  ? 'Recording'
                  : 'Built-in',
            disabled: !voice.available
          }))}
          onChange={(value) => updateSettings('voice', value)}
        />
        <CatalogSelect
          label="Language"
          value={settings.language}
          options={languages.map((language) => ({
            value: language.code,
            label: language.label,
            description: language.nativeLabel
          }))}
          onChange={(value) => updateSettings('language', value as GenerationSettings['language'])}
        />
        <CatalogSelect
          label="Model"
          value={settings.model}
          options={models.map((model) => ({
            value: model.id,
            label: model.id === 'auto' ? 'Auto' : model.label,
            description: model.description
          }))}
          onChange={(value) => updateSettings('model', value as GenerationSettings['model'])}
        />
      </FieldGroup>
      <FieldGroup className="grid grid-cols-2 gap-4">
        <Field>
          <FieldLabel htmlFor={`${id}-format`}>Format</FieldLabel>
          <Select
            value={settings.format}
            onValueChange={(value) =>
              updateSettings('format', value as GenerationSettings['format'])
            }
          >
            <SelectTrigger id={`${id}-format`} className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {(['wav', 'mp3', 'flac', 'ogg', 'm4a'] as const).map((format) => (
                  <SelectItem key={format} value={format}>
                    {format.toUpperCase()}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </Field>
        <Field>
          <FieldLabel htmlFor={`${id}-speed`}>Speed (×)</FieldLabel>
          <Input
            id={`${id}-speed`}
            type="number"
            min={0.5}
            max={2}
            step={0.05}
            value={settings.speed}
            onChange={(event) => {
              const value = event.target.valueAsNumber
              if (Number.isFinite(value) && value >= 0.5 && value <= 2)
                updateSettings('speed', value)
            }}
          />
        </Field>
      </FieldGroup>
      {!compact && (
        <BooleanField
          label="Detect language"
          description="One language per narration. Detection is approximate."
          checked={settings.auto_detect}
          onChange={(value) => updateSettings('auto_detect', value)}
        />
      )}
    </FieldGroup>
  )
}
