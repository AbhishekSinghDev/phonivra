import { RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Skeleton } from '@/components/ui/skeleton'
import { WindowedList } from '@/components/studio/windowed-list'
import { act } from '@/lib/actions'
import { useStudioStore } from '@/stores/studio-store'

export default function TextInspection({
  open,
  onOpenChange
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}): React.JSX.Element {
  const inspection = useStudioStore((state) => state.snapshot?.inspection)
  const status = useStudioStore((state) => state.snapshot?.status)
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-5/6 sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Text and parts</DialogTitle>
          <DialogDescription>
            Inspect what will be narrated. The original script stays unchanged.
          </DialogDescription>
        </DialogHeader>
        {!inspection ? (
          status ? (
            <Alert variant="destructive">
              <AlertTitle>Text could not be prepared</AlertTitle>
              <AlertDescription>{status}</AlertDescription>
            </Alert>
          ) : (
            <div className="flex flex-col gap-3" aria-label="Preparing text">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-64 w-full" />
            </div>
          )
        ) : inspection.status === 'error' ? (
          <Alert variant="destructive">
            <AlertTitle>Text could not be prepared</AlertTitle>
            <AlertDescription>{inspection.error}</AlertDescription>
          </Alert>
        ) : (
          <Tabs defaultValue="text">
            <TabsList>
              <TabsTrigger value="text">Prepared text</TabsTrigger>
              <TabsTrigger value="parts">Parts ({inspection.parts.length})</TabsTrigger>
            </TabsList>
            <TabsContent value="text" className="pt-4">
              <ScrollArea className="h-72">
                <p className="whitespace-pre-wrap break-words pr-4 text-sm leading-7">
                  {inspection.preparedText}
                </p>
              </ScrollArea>
            </TabsContent>
            <TabsContent value="parts" className="pt-4">
              <WindowedList
                items={inspection.parts}
                itemKey={(part) => part.id}
                label="Prepared narration parts"
                rowHeight={96}
                renderItem={(part) => (
                  <div className="flex h-full gap-4 py-3 pr-4">
                    <span className="text-xs tabular-nums text-muted-foreground">{part.index}</span>
                    <div className="flex min-w-0 flex-1 flex-col gap-1">
                      <p className="line-clamp-2 text-sm" title={part.text}>
                        {part.text}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {part.text.length} characters · {part.pause}s pause after
                      </p>
                    </div>
                  </div>
                )}
              />
            </TabsContent>
          </Tabs>
        )}
        <div className="flex flex-col gap-3">
          {inspection?.notes.map((note) => (
            <p key={note} className="text-xs leading-relaxed text-muted-foreground">
              {note}
            </p>
          ))}
          {import.meta.env.DEV && (
            <p className="text-xs text-muted-foreground">
              Mock inspection: text cleanup and part boundaries need backend work.
            </p>
          )}
          <Button
            variant="outline"
            size="sm"
            className="self-start"
            onClick={() => act('Refresh prepared text', { type: 'script.inspect' })}
          >
            <RefreshCw data-icon="inline-start" aria-hidden="true" />
            Refresh inspection
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
