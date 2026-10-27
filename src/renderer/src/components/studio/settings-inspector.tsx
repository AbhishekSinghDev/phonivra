import { SlidersHorizontal } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger
} from '@/components/ui/sheet'
import { ScrollArea } from '@/components/ui/scroll-area'
import { AdvancedSettings } from './settings-fields'
import { notify } from '@/lib/notify'

export function SettingsInspector(): React.JSX.Element {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm" onClick={() => notify('Advanced settings clicked')}>
          <SlidersHorizontal data-icon="inline-start" aria-hidden="true" />
          Advanced settings
        </Button>
      </SheetTrigger>
      <SheetContent className="sm:max-w-xl">
        <SheetHeader>
          <SheetTitle>Advanced settings</SheetTitle>
          <SheetDescription>Applied to the next narration or batch.</SheetDescription>
        </SheetHeader>
        <ScrollArea className="min-h-0 flex-1 px-6 pb-6">
          <AdvancedSettings />
        </ScrollArea>
      </SheetContent>
    </Sheet>
  )
}
