import { useState } from 'react'
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
import { Input } from '@/components/ui/input'
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger
} from '@/components/ui/accordion'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { WindowedList } from '@/components/studio/windowed-list'
import { ScenarioControls } from './scenario-controls'
import { fixtures } from '../../../../shared/data/fixtures'
import { reviewActions } from '@/lib/actions'
import { notify } from '@/lib/notify'

export default function ReviewTools({
  screen = 'Narrate'
}: {
  screen?: string
}): React.JSX.Element {
  const [query, setQuery] = useState('')
  const matches = fixtures.filter((fixture) =>
    `${fixture.label} ${fixture.section} ${fixture.description}`
      .toLowerCase()
      .includes(query.toLowerCase())
  )
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="sm" onClick={() => notify('Review states clicked')}>
          <SlidersHorizontal data-icon="inline-start" aria-hidden="true" />
          Review states
        </Button>
      </SheetTrigger>
      <SheetContent className="sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>{screen} review</SheetTitle>
          <SheetDescription>Review mock states without leaving this screen.</SheetDescription>
        </SheetHeader>
        <ScrollArea className="min-h-0 flex-1 px-6 pb-6">
          <ScenarioControls />
          <Accordion type="single" collapsible className="mt-6">
            <AccordionItem value="all">
              <AccordionTrigger>All inventory cases ({fixtures.length})</AccordionTrigger>
              <AccordionContent>
                <FieldGroup>
                  <Field>
                    <FieldLabel htmlFor="review-case-search">Find a case</FieldLabel>
                    <Input
                      id="review-case-search"
                      value={query}
                      onChange={(event) => setQuery(event.target.value)}
                      placeholder="Error wording, section or state…"
                    />
                  </Field>
                </FieldGroup>
                <WindowedList
                  items={matches}
                  itemKey={(fixture) => fixture.id}
                  label="Inventory cases"
                  rowHeight={80}
                  renderItem={(fixture) => (
                    <Button
                      variant="ghost"
                      className="h-full w-full justify-start whitespace-normal text-left"
                      onClick={() => reviewActions.scenario(fixture.id)}
                    >
                      <span className="line-clamp-2 min-w-0 flex-1">{fixture.label}</span>
                      <Badge variant="outline">{fixture.section}</Badge>
                    </Button>
                  )}
                />
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  )
}
