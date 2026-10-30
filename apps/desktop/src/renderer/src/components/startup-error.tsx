import { HugeiconsIcon } from '@hugeicons/react'
import { AudioLinesIcon, AlertCircleIcon } from '@hugeicons/core-free-icons'

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
          <HugeiconsIcon icon={AudioLinesIcon} className="size-5" aria-hidden="true" />
          Phonivra
        </div>
        <div role="alert" className="flex flex-col gap-1 text-sm text-destructive">
          <HugeiconsIcon icon={AlertCircleIcon} aria-hidden="true" />
          <p className="font-medium">
            {browser ? 'Open Phonivra in its desktop window' : 'Desktop connection unavailable'}
          </p>
          <div className="leading-relaxed">{message}</div>
        </div>
        <p className="text-sm leading-relaxed text-muted-foreground">
          {browser
            ? 'The development URL serves the interface. Device access and app settings are supplied by Electron when the desktop window opens.'
            : 'Close and restart Phonivra. If this continues, check the terminal for an “Unable to load preload script” error.'}
        </p>
      </div>
    </main>
  )
}
