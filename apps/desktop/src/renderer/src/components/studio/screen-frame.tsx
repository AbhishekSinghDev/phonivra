import { type ReactNode } from 'react'
import { Skeleton } from '@phonivra/ui/components/skeleton'
import { Button } from '@phonivra/ui/components/button'
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle
} from '@phonivra/ui/components/empty'
import { retryStudioConnection } from '@/lib/actions'
import { useStudioStore } from '@/stores/studio-store'

export function ScreenFrame({
  title,
  description,
  actions,
  children
}: {
  title: string
  description: ReactNode
  actions?: ReactNode
  children: ReactNode
}): React.JSX.Element {
  return (
    <div className="studio-page mx-auto flex w-full max-w-6xl flex-col gap-8 pb-6">
      <header className="flex flex-col items-center gap-5 text-center">
        <div className="flex flex-col items-center gap-3">
          <h1 className="text-2xl font-medium tracking-tight sm:text-3xl">{title}</h1>
          <p className="max-w-2xl text-base leading-relaxed text-muted-foreground">{description}</p>
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
      </header>
      {children}
    </div>
  )
}
export function ScreenLoading(): React.JSX.Element {
  const error = useStudioStore((state) => state.error)
  if (error)
    return (
      <Empty>
        <EmptyHeader>
          <EmptyTitle>Could not connect to the studio</EmptyTitle>
          <EmptyDescription role="alert">{error}</EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Button variant="outline" onClick={retryStudioConnection}>
            Retry connection
          </Button>
        </EmptyContent>
      </Empty>
    )
  return (
    <section aria-label="Loading screen" className="flex flex-col gap-4">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-12 w-full" />
      <Skeleton className="h-80 w-full" />
    </section>
  )
}
export function DetailValue({
  label,
  children
}: {
  label: string
  children: ReactNode
}): React.JSX.Element {
  return (
    <div className="flex min-w-0 flex-col gap-1">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="break-words text-sm">{children}</dd>
    </div>
  )
}
