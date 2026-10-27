import { AudioLines, CircleAlert } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'

export function StartupError({
  message,
  browser
}: {
  message: string
  browser: boolean
}): React.JSX.Element {
  return (
    <main className="flex h-dvh items-center justify-center bg-background p-8 text-foreground">
      <div className="flex w-full max-w-lg flex-col gap-6">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <AudioLines className="size-5" aria-hidden="true" />
          Phonivra
        </div>
        <Alert variant="destructive">
          <CircleAlert aria-hidden="true" />
          <AlertTitle>
            {browser ? 'Open Phonivra in its desktop window' : 'Desktop connection unavailable'}
          </AlertTitle>
          <AlertDescription>{message}</AlertDescription>
        </Alert>
        <p className="text-sm leading-relaxed text-muted-foreground">
          {browser
            ? 'The development URL serves the interface. Device access and app settings are supplied by Electron when the desktop window opens.'
            : 'Close and restart Phonivra. If this continues, check the terminal for an “Unable to load preload script” error.'}
        </p>
      </div>
    </main>
  )
}
