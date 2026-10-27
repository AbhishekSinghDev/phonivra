import { useId, useState } from 'react'
import { BookOpenText } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog'
import { Field, FieldDescription, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Textarea } from '@/components/ui/textarea'
import { BooleanField } from './settings-fields'
import { act, updateSettings } from '@/lib/actions'
import { notify } from '@/lib/notify'
import { useStudioStore } from '@/stores/studio-store'

export function DictionaryEditor(): React.JSX.Element | null {
  const dictionary = useStudioStore((state) => state.snapshot?.dictionary ?? '')
  const enabled = useStudioStore((state) => state.snapshot?.settings.pronounce ?? false)
  const [draft, setDraft] = useState<string | null>(null)
  const id = useId()
  return (
    <Dialog
      onOpenChange={(open) => {
        if (open) setDraft(null)
      }}
    >
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => notify('Pronunciation dictionary clicked')}
        >
          <BookOpenText data-icon="inline-start" aria-hidden="true" />
          Pronunciation dictionary
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Pronunciation dictionary</DialogTitle>
          <DialogDescription>
            Replace words or phrases before narration. Rules are saved separately from your script.
          </DialogDescription>
        </DialogHeader>
        <FieldGroup>
          <BooleanField
            label="Use dictionary"
            description="Apply rules to narration and batch generation."
            checked={enabled}
            onChange={(value) => updateSettings('pronounce', value)}
          />
          <Field>
            <FieldLabel htmlFor={id}>Rules</FieldLabel>
            <Textarea
              id={id}
              rows={8}
              value={draft ?? dictionary}
              placeholder={'# One rule per line\nPhonivra => fo-nee-vra'}
              onChange={(event) => setDraft(event.target.value)}
              aria-describedby={`${id}-hint`}
            />
            <FieldDescription id={`${id}-hint`}>
              Use =, =&gt;, or -&gt; between a word and its pronunciation. # starts a comment.
              Matches are case-insensitive, whole words or phrases, longest first.
            </FieldDescription>
          </Field>
          <p className="text-xs text-muted-foreground">
            Rules can affect text produced by earlier rules. Empty content clears the saved
            dictionary.
          </p>
          <Button
            className="self-start"
            onClick={() =>
              act('Save dictionary', { type: 'dictionary.save', text: draft ?? dictionary })
            }
          >
            Save dictionary
          </Button>
        </FieldGroup>
      </DialogContent>
    </Dialog>
  )
}
