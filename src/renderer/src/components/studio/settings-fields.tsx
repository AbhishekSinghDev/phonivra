import { useId } from 'react'
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet
} from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger
} from '@/components/ui/accordion'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { CatalogSelect } from './catalog-select'
import {
  cleanupSettings,
  languages,
  models,
  numericSettings,
  resolvedModel
} from '../../../../shared/data/catalog'
import type { GenerationSettings, NumericSetting, SamplingKey } from '../../../../shared/studio'
import { updateSettings } from '@/lib/actions'
import { useStudioStore } from '@/stores/studio-store'

export function NumericField({
  field,
  value,
  disabled,
  onChange
}: {
  field: NumericSetting
  value: number
  disabled?: boolean
  onChange: (value: number) => void
}): React.JSX.Element {
  const id = useId()
  const invalid = !Number.isFinite(value) || value < field.min || value > field.max
  return (
    <Field data-disabled={disabled} data-invalid={invalid}>
      <FieldLabel htmlFor={id}>
        {field.label}
        {field.unit && <span className="text-muted-foreground">({field.unit.trim()})</span>}
      </FieldLabel>
      <Input
        id={id}
        type="number"
        min={field.min}
        max={field.max}
        step={field.step}
        value={value}
        disabled={disabled}
        aria-invalid={invalid}
        aria-describedby={`${id}-hint`}
        onChange={(event) => {
          const number = event.target.valueAsNumber
          if (Number.isFinite(number)) onChange(number)
        }}
      />
      <FieldDescription id={`${id}-hint`}>{field.description}</FieldDescription>
      {invalid && (
        <FieldError>
          Choose a value from {field.min} to {field.max}.
        </FieldError>
      )}
    </Field>
  )
}
export function BooleanField({
  label,
  description,
  checked,
  disabled,
  onChange
}: {
  label: string
  description: string
  checked: boolean
  disabled?: boolean
  onChange: (checked: boolean) => void
}): React.JSX.Element {
  const id = useId()
  return (
    <Field orientation="horizontal" data-disabled={disabled}>
      <FieldContent>
        <FieldLabel htmlFor={id}>{label}</FieldLabel>
        <FieldDescription id={`${id}-hint`}>{description}</FieldDescription>
      </FieldContent>
      <Switch
        id={id}
        checked={checked}
        disabled={disabled}
        aria-describedby={`${id}-hint`}
        onCheckedChange={onChange}
      />
    </Field>
  )
}
export function EssentialSettings(): React.JSX.Element | null {
  const settings = useStudioStore((s) => s.snapshot?.settings)
  const voices = useStudioStore((s) => s.snapshot?.voices)
  if (!settings || !voices) return null
  const effective = resolvedModel(settings)
  const language = languages.find((l) => l.code === settings.language)
  const compatible = effective.languages.includes(settings.language)
  return (
    <FieldGroup>
      <CatalogSelect
        label="Voice"
        value={settings.voice}
        options={voices.map((v) => ({
          value: v.id,
          label: v.label,
          description: v.kind,
          disabled: !v.available
        }))}
        onChange={(value) => updateSettings('voice', value)}
      />
      <div className="grid gap-4 lg:grid-cols-2">
        <CatalogSelect
          label="Language"
          value={settings.language}
          options={languages.map((l) => ({
            value: l.code,
            label: l.label,
            description: l.nativeLabel
          }))}
          onChange={(value) => updateSettings('language', value as GenerationSettings['language'])}
        />
        <CatalogSelect
          label="Model"
          value={settings.model}
          options={models.map((m) => ({ value: m.id, label: m.label, description: m.parameters }))}
          onChange={(value) => updateSettings('model', value as GenerationSettings['model'])}
        />
      </div>
      <BooleanField
        label="Detect language"
        description="Heuristic detection; one language per narration. Does not translate."
        checked={settings.auto_detect}
        onChange={(value) => updateSettings('auto_detect', value)}
      />
      {!compatible && (
        <Alert variant="destructive">
          <AlertTitle>Choose a compatible model</AlertTitle>
          <AlertDescription>
            {effective.label} is English-only. Choose Multilingual V3 or Auto for {language?.label}.
          </AlertDescription>
        </Alert>
      )}
      {settings.model === 'auto' && (
        <p className="text-sm text-muted-foreground">
          Uses {effective.label} for {language?.label}.
        </p>
      )}
      <div className="grid gap-4 lg:grid-cols-2">
        <Field>
          <FieldLabel htmlFor="output-format">Format</FieldLabel>
          <Select
            value={settings.format}
            onValueChange={(value) =>
              updateSettings('format', value as GenerationSettings['format'])
            }
          >
            <SelectTrigger id="output-format" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {['wav', 'mp3', 'flac', 'ogg', 'm4a'].map((format) => (
                  <SelectItem key={format} value={format}>
                    {format.toUpperCase()}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </Field>
        <NumericField
          field={numericSettings[0]}
          value={settings.speed}
          onChange={(value) => updateSettings('speed', value)}
        />
      </div>
    </FieldGroup>
  )
}
export function AdvancedSettings(): React.JSX.Element | null {
  const settings = useStudioStore((s) => s.snapshot?.settings)
  if (!settings) return null
  const effective = resolvedModel(settings)
  return (
    <Accordion type="multiple" className="w-full">
      <AccordionItem value="preparation">
        <AccordionTrigger>Text preparation</AccordionTrigger>
        <AccordionContent>
          <FieldSet>
            <FieldLegend variant="label">Before synthesis</FieldLegend>
            <FieldGroup>
              {cleanupSettings.map((field) => (
                <BooleanField
                  key={field.key}
                  label={field.label}
                  description={field.description}
                  checked={settings[field.key]}
                  onChange={(value) => updateSettings(field.key, value)}
                />
              ))}
            </FieldGroup>
          </FieldSet>
        </AccordionContent>
      </AccordionItem>
      {(['parts', 'sampling', 'mastering'] as const).map((group) => (
        <AccordionItem key={group} value={group}>
          <AccordionTrigger>
            {group === 'parts'
              ? 'Parts and pauses'
              : group === 'sampling'
                ? 'Sampling and expression'
                : 'Mastering'}
          </AccordionTrigger>
          <AccordionContent>
            <FieldGroup>
              {group === 'sampling' && (
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary">{effective.label}</Badge>
                  <Badge variant="outline">1000 speech tokens per part</Badge>
                </div>
              )}
              {group === 'mastering' && (
                <>
                  <BooleanField
                    label="Trim edge silence"
                    description="Trim below −45 dB, keeping 50ms padding."
                    checked={settings.trim_silence}
                    onChange={(value) => updateSettings('trim_silence', value)}
                  />
                  <BooleanField
                    label="Normalize loudness"
                    description="Peak limited; gain clamped to ±24 dB."
                    checked={settings.loudness}
                    onChange={(value) => updateSettings('loudness', value)}
                  />
                </>
              )}
              <div className="grid gap-6 sm:grid-cols-2">
                {numericSettings
                  .filter(
                    (field) =>
                      field.group === group &&
                      (group !== 'sampling' ||
                        field.key === 'seed' ||
                        effective.sampling.includes(field.key as SamplingKey))
                  )
                  .map((field) => (
                    <NumericField
                      key={field.key}
                      field={field}
                      value={settings[field.key]}
                      disabled={field.key === 'loudness_target' && !settings.loudness}
                      onChange={(value) => updateSettings(field.key, value)}
                    />
                  ))}
              </div>
              {group === 'sampling' && (
                <p className="text-sm text-muted-foreground">
                  Controls unsupported by this model are hidden.{' '}
                  {effective.reactions
                    ? 'Native reaction tags are available.'
                    : 'Native reaction tags are not supported.'}
                </p>
              )}
            </FieldGroup>
          </AccordionContent>
        </AccordionItem>
      ))}
      <AccordionItem value="export">
        <AccordionTrigger>Export details</AccordionTrigger>
        <AccordionContent>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="sample-rate">Sample rate</FieldLabel>
              <Select
                value={String(settings.sample_rate)}
                onValueChange={(value) => updateSettings('sample_rate', Number(value))}
              >
                <SelectTrigger id="sample-rate">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {[24000, 44100, 48000].map((rate) => (
                      <SelectItem key={rate} value={String(rate)}>
                        {rate / 1000} kHz
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
              <FieldDescription>
                Models generate mono 24 kHz audio. Resampling requires FFmpeg.
              </FieldDescription>
            </Field>
            <p className="text-sm text-muted-foreground">
              WAV and FLAC use 16-bit samples. MP3 and M4A use 192 kbps; OGG uses quality 6.
              Subtitles use approximate sentence timing.
            </p>
          </FieldGroup>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  )
}
