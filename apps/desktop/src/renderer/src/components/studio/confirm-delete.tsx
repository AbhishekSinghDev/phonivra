import { useId, useState } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import { TrashIcon } from '@hugeicons/core-free-icons'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger
} from '@phonivra/ui/components/alert-dialog'
import { Button } from '@phonivra/ui/components/button'
import { Checkbox } from '@phonivra/ui/components/checkbox'
import { Field, FieldGroup, FieldLabel } from '@phonivra/ui/components/field'
import { notify } from '@/lib/notify'

export function ConfirmDelete({
  name,
  description,
  onConfirm,
  disabled
}: {
  name: string
  description: string
  onConfirm: () => void
  disabled?: boolean
}): React.JSX.Element {
  const [confirmed, setConfirmed] = useState(false)
  const id = useId()
  return (
    <AlertDialog onOpenChange={() => setConfirmed(false)}>
      <AlertDialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          disabled={disabled}
          onClick={() => notify('Review deletion clicked')}
        >
          <HugeiconsIcon icon={TrashIcon} data-icon="inline-start" aria-hidden="true" />
          Delete
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete {name}?</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <FieldGroup>
          <Field orientation="horizontal">
            <Checkbox
              id={id}
              checked={confirmed}
              onCheckedChange={(value) => setConfirmed(value === true)}
            />
            <FieldLabel htmlFor={id}>I understand this removes the selected item.</FieldLabel>
          </Field>
        </FieldGroup>
        <AlertDialogFooter>
          <AlertDialogCancel>Keep item</AlertDialogCancel>
          <AlertDialogAction variant="destructive" disabled={!confirmed} onClick={onConfirm}>
            Delete item
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
