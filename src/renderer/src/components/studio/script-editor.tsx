import { useRef } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import { FileUpIcon, FolderOpenIcon, SaveIcon } from '@hugeicons/core-free-icons'
import { Button } from '@/components/ui/button'
import { Field, FieldDescription, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { act, updateSettings } from '@/lib/actions'
import { useStudioStore } from '@/stores/studio-store'

export function ScriptEditor(): React.JSX.Element | null {
  const settings = useStudioStore((state) => state.snapshot?.settings)
  const script = useStudioStore((state) => state.snapshot?.script ?? '')
  const editor = useRef<HTMLTextAreaElement>(null)
  if (!settings) return null
  return (
    <FieldGroup>
      <Field>
        <FieldLabel htmlFor="narration-title">Title</FieldLabel>
        <Input
          id="narration-title"
          value={settings.title}
          maxLength={120}
          placeholder="Untitled narration"
          onChange={(event) => updateSettings('title', event.target.value)}
        />
      </Field>
      <Field>
        <FieldLabel htmlFor="narration-script">Script</FieldLabel>
        <Textarea
          ref={editor}
          id="narration-script"
          rows={8}
          value={script}
          placeholder="Write or paste your narration…"
          aria-describedby="script-description"
          onChange={(event) =>
            act('Edit script', { type: 'script.update', text: event.target.value })
          }
        />
        <FieldDescription id="script-description">
          {script.length.toLocaleString()} characters. Text cleanup preserves the script you write
          here.
        </FieldDescription>
      </Field>
      <div className="flex flex-wrap gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => act('Import script', { type: 'script.import' })}
        >
          <HugeiconsIcon icon={FileUpIcon} data-icon="inline-start" aria-hidden="true" />
          Import script
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            const start = editor.current?.selectionStart ?? script.length
            const end = editor.current?.selectionEnd ?? script.length
            act('Insert pause', {
              type: 'script.update',
              text: `${script.slice(0, start)}[pause]${script.slice(end)}`
            })
            editor.current?.focus()
          }}
        >
          Insert pause
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => act('Save project', { type: 'project.save' })}
        >
          <HugeiconsIcon icon={SaveIcon} data-icon="inline-start" aria-hidden="true" />
          Save project
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => act('Open project', { type: 'project.open' })}
        >
          <HugeiconsIcon icon={FolderOpenIcon} data-icon="inline-start" aria-hidden="true" />
          Open project
        </Button>
      </div>
    </FieldGroup>
  )
}
