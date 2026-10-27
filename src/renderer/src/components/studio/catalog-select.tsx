import { useId, useState } from 'react'
import { Check, ChevronsUpDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import {
  Command,
  CommandInput,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList
} from '@/components/ui/command'
import { Field, FieldDescription, FieldLabel } from '@/components/ui/field'

export interface CatalogOption {
  value: string
  label: string
  description?: string
  disabled?: boolean
}
export function CatalogSelect({
  label,
  value,
  options,
  onChange,
  disabled = false,
  description
}: {
  label: string
  value: string
  options: readonly CatalogOption[]
  onChange: (value: string) => void
  disabled?: boolean
  description?: string
}): React.JSX.Element {
  const id = useId()
  const [open, setOpen] = useState(false)
  return (
    <Field data-disabled={disabled}>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            id={id}
            variant="outline"
            role="combobox"
            aria-expanded={open}
            disabled={disabled}
            className="w-full justify-between"
            aria-describedby={description ? `${id}-hint` : undefined}
          >
            <span className="truncate">
              {options.find((option) => option.value === value)?.label ?? 'Choose an option'}
            </span>
            <ChevronsUpDown data-icon="inline-end" aria-hidden="true" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80 p-0" align="start">
          <Command>
            <CommandInput
              placeholder={`Find ${label.toLowerCase()}…`}
              aria-label={`Find ${label.toLowerCase()}`}
            />
            <CommandList>
              <CommandEmpty>No matching options.</CommandEmpty>
              <CommandGroup>
                {options.map((option) => (
                  <CommandItem
                    key={option.value}
                    value={`${option.label} ${option.description ?? ''}`}
                    disabled={option.disabled}
                    onSelect={() => {
                      onChange(option.value)
                      setOpen(false)
                    }}
                  >
                    <span className="flex min-w-0 flex-1 flex-col gap-1">
                      <span>{option.label}</span>
                      {option.description && (
                        <span className="text-xs text-muted-foreground">{option.description}</span>
                      )}
                    </span>
                    {value === option.value && <Check aria-hidden="true" />}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      {description && <FieldDescription id={`${id}-hint`}>{description}</FieldDescription>}
    </Field>
  )
}
