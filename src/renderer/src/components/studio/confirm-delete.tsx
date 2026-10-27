import { useId, useState } from 'react'
import { Trash2 } from 'lucide-react'
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
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field'
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
          <Trash2 data-icon="inline-start" aria-hidden="true" />
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
