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
import {
  ParameterSlider,
  ParameterSliderHeader,
  ParameterSliderLabel,
  ParameterSliderInput,
  ParameterSliderControl,
  ParameterSliderDescription
} from '@/components/ui/parameter-slider'
import { Switch } from '@/components/ui/switch'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger
} from '@/components/ui/accordion'
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
  defaultSettings,
  languages,
  models,
  numericSettings,
  resolvedModel
} from '../../../../shared/data/catalog'
import type { NumericSetting, SamplingKey } from '../../../../shared/studio'
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
  if (field.key !== 'seed') {
    return (
      <ParameterSlider
        key={`${field.key}:${value}`}
        defaultValue={value}
        min={field.min}
        max={field.max}
        step={field.step}
        resetValue={defaultSettings[field.key]}
        unit={field.unit?.trim()}
        disabled={disabled}
        onValueCommitted={onChange}
      >
        <ParameterSliderHeader>
          <ParameterSliderLabel>{field.label}</ParameterSliderLabel>
          <ParameterSliderInput />
        </ParameterSliderHeader>
        <ParameterSliderControl />
        <ParameterSliderDescription>{field.description}</ParameterSliderDescription>
      </ParameterSlider>
    )
  }
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
  const id = useId()
  const settings = useStudioStore((s) => s.snapshot?.settings)
  const voices = useStudioStore((s) => s.snapshot?.voices)
  const reference = useStudioStore((s) => s.snapshot?.reference)
  if (!settings || !voices) return null
  const effective = resolvedModel(settings)
  const language = languages.find((l) => l.code === settings.language)
  const compatible = effective.languages.includes(settings.language)
  return (
    <FieldGroup className="gap-5">
      <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-1">
        <CatalogSelect
          label="Voice"
          value={settings.voice}
          options={voices.map((v) => ({
            value: v.id,
            label: v.label,
            description:
              v.kind === 'custom'
                ? 'Saved voice'
                : v.kind === 'external'
                  ? 'Recording'
                  : 'Built-in voice',
            disabled: !v.available
          }))}
          description={
            reference?.status === 'ready'
              ? `Using recording: ${reference.name}. Clear it in Voice reference to use a preset.`
              : undefined
          }
          disabled={reference?.status === 'ready'}
          onChange={(value) => updateSettings('voice', value)}
        />
        <CatalogSelect
          label="Language"
          value={settings.language}
          options={languages.map((l) => ({
            value: l.code,
            label: l.label,
            description: l.nativeLabel
          }))}
          description={
            settings.auto_detect
              ? 'Auto-detection is on. This language may change when you generate.'
              : undefined
          }
          onChange={(value) => {
            const language = languages.find((item) => item.code === value)
            if (language) updateSettings('language', language.code)
          }}
        />
      </div>
      {!compatible && (
        <div role="alert" className="flex flex-col gap-1 text-sm text-destructive">
          <p className="font-medium">Choose a compatible model</p>
          <div className="leading-relaxed">
            {effective.label} is English-only. Choose Multilingual V3 or Auto in Advanced settings
            for {language?.label}.
          </div>
        </div>
      )}
      <div className="grid grid-cols-2 gap-4">
        <Field>
          <FieldLabel htmlFor={`${id}-format`}>Format</FieldLabel>
          <Select
            value={settings.format}
            onValueChange={(value) =>
              (value === 'wav' ||
                value === 'mp3' ||
                value === 'flac' ||
                value === 'ogg' ||
                value === 'm4a') &&
              updateSettings('format', value)
            }
          >
            <SelectTrigger id={`${id}-format`} className="h-10 w-full rounded-xl">
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
        <ParameterSlider
          key={settings.speed}
          defaultValue={settings.speed}
          min={0.5}
          max={2}
          step={0.05}
          unit="×"
          resetValue={1}
          onValueCommitted={(value) => updateSettings('speed', value)}
        >
          <ParameterSliderHeader>
            <ParameterSliderLabel>Speed</ParameterSliderLabel>
            <ParameterSliderInput />
          </ParameterSliderHeader>
          <ParameterSliderControl />
          <ParameterSliderDescription className="sr-only">
            Changes pacing while preserving pitch. Choose 0.5 to 2 times speed.
          </ParameterSliderDescription>
        </ParameterSlider>
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
      <AccordionItem value="model">
        <AccordionTrigger>Model and language detection</AccordionTrigger>
        <AccordionContent>
          <FieldGroup>
            <CatalogSelect
              label="Speech model"
              value={settings.model}
              options={models.map((model) => ({
                value: model.id,
                label: model.label,
                description: model.description
              }))}
              onChange={(value) => {
                const model = models.find((item) => item.id === value)
                if (model) updateSettings('model', model.id)
              }}
              description={`Currently uses ${effective.label}. Auto chooses a model for your language.`}
            />
            <BooleanField
              label="Detect language automatically"
              description="Detect one language per narration, or separately for each batch item. Review short or mixed-language scripts; detection is approximate."
              checked={settings.auto_detect}
              onChange={(value) => updateSettings('auto_detect', value)}
            />
          </FieldGroup>
        </AccordionContent>
      </AccordionItem>
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
