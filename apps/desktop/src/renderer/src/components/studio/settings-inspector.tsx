import { HugeiconsIcon } from '@hugeicons/react'
import { SlidersHorizontalIcon } from '@hugeicons/core-free-icons'
import { Button } from '@phonivra/ui/components/button'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger
} from '@phonivra/ui/components/sheet'
import { ScrollArea } from '@phonivra/ui/components/scroll-area'
import { AdvancedSettings } from './settings-fields'
import { DictionaryEditor } from './dictionary-editor'

export function SettingsInspector(): React.JSX.Element {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm">
          <HugeiconsIcon icon={SlidersHorizontalIcon} data-icon="inline-start" aria-hidden="true" />
          Advanced settings
        </Button>
      </SheetTrigger>
      <SheetContent className="sm:max-w-xl">
        <SheetHeader>
          <SheetTitle>Advanced settings</SheetTitle>
          <SheetDescription>
            Set the speech model, script cleanup, and audio format for the next generation.
          </SheetDescription>
        </SheetHeader>
        <ScrollArea className="min-h-0 flex-1 px-6 pb-6">
          <AdvancedSettings />
          <div className="pt-4">
            <DictionaryEditor />
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  )
}
