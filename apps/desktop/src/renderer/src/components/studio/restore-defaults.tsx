import type { ReactNode } from 'react'
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
import { act } from '@/lib/actions'

export function RestoreDefaults({ children }: { children: ReactNode }): React.JSX.Element {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>{children}</AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Restore factory defaults?</AlertDialogTitle>
          <AlertDialogDescription>
            This resets your title, voice, language and all generation settings, including saved
            defaults. Your script, dictionary and attached reference are kept.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Keep current settings</AlertDialogCancel>
          <AlertDialogAction
            onClick={() => act('Restore generation defaults', { type: 'settings.restore' })}
          >
            Restore defaults
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
