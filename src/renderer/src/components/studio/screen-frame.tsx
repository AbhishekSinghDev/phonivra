import { lazy, Suspense, type ReactNode } from 'react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { act } from '@/lib/actions'
import { useStudioStore } from '@/stores/studio-store'
const ReviewTools = import.meta.env.DEV
  ? lazy(() => import('@/features/interface-reference/review-tools'))
  : null

export function StatusFeedback(): React.JSX.Element | null {
  const error = useStudioStore((state) => state.error)
  const status = useStudioStore(
    (state) =>
      state.snapshot?.status ??
      (state.snapshot?.job.phase === 'error' ? state.snapshot.job.message : null)
  )
  const failed = useStudioStore(
    (state) => state.snapshot?.statusIsError || state.snapshot?.job.phase === 'error'
  )
  if (!status && !error) return null
  return (
    <Alert variant={error || failed ? 'destructive' : 'default'}>
      <AlertTitle>{error || failed ? 'Action needs attention' : 'Status'}</AlertTitle>
      <AlertDescription>
        <span>{error ?? status}</span>
        <Button
          variant="link"
          size="sm"
          onClick={() => {
            useStudioStore.getState().setError(null)
            void act('Dismiss status', { type: 'status.dismiss' })
          }}
        >
          Dismiss
        </Button>
      </AlertDescription>
    </Alert>
  )
}
export function ScreenFrame({
  title,
  description,
  actions,
  children
}: {
  title: string
  description: string
  actions?: ReactNode
  children: ReactNode
}): React.JSX.Element {
  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 pb-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
          <p className="max-w-2xl text-sm text-muted-foreground">{description}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {ReviewTools && (
            <Suspense fallback={null}>
              <ReviewTools screen={title} />
            </Suspense>
          )}
          {actions}
        </div>
      </header>
      <StatusFeedback />
      {children}
    </div>
  )
}
export function ScreenLoading(): React.JSX.Element {
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
