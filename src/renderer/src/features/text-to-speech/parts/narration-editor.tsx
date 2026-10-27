import { memo, useDeferredValue, useEffect, useMemo, useRef, useState } from 'react'
import { FileUp, Plus, Timer } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Field, FieldDescription, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { act, editScript, flushScriptDraft, updateSettings } from '@/lib/actions'
import { notify } from '@/lib/notify'
import { reactionTags } from '../../../../../shared/data/catalog'

interface EditorProps {
  initialText: string
  title: string
  reactions: boolean
  inspect: () => void
  onGenerate: () => void
}
export const NarrationEditor = memo(function NarrationEditor({
  initialText,
  title,
  reactions,
  inspect,
  onGenerate
}: EditorProps): React.JSX.Element {
  const [draft, setDraft] = useState(initialText)
  const editor = useRef<HTMLTextAreaElement>(null)
  const selection = useRef({ start: initialText.length, end: initialText.length })
  const deferred = useDeferredValue(draft)
  const words = useMemo(
    () => (deferred.trim() ? deferred.trim().split(/\s+/u).length : 0),
    [deferred]
  )
  useEffect(
    () => () => {
      void flushScriptDraft()
    },
    []
  )
  function changeText(text: string): void {
    setDraft(text)
    editScript(text)
  }
  function insert(text: string): void {
    const { start, end } = selection.current
    const next = `${draft.slice(0, start)}${text}${draft.slice(end)}`
    changeText(next)
    notify('Insert markup clicked')
    requestAnimationFrame(() => {
      editor.current?.focus()
      editor.current?.setSelectionRange(start + text.length, start + text.length)
    })
  }
  return (
    <section aria-label="Narration script" className="flex min-w-0 flex-col gap-4">
      <FieldGroup className="gap-4">
        <Field>
          <FieldLabel htmlFor="narrate-title">Title</FieldLabel>
          <Input
            id="narrate-title"
            value={title}
            maxLength={120}
            placeholder="Untitled narration"
            onChange={(event) => updateSettings('title', event.target.value)}
          />
        </Field>
        <Field className="gap-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <FieldLabel htmlFor="narrate-script">Script</FieldLabel>
            <div className="flex items-center gap-1">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => act('Import script', { type: 'script.import' })}
              >
                <FileUp data-icon="inline-start" aria-hidden="true" />
                Import script
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button size="sm" variant="ghost" onClick={() => notify('Insert menu clicked')}>
                    <Plus data-icon="inline-start" aria-hidden="true" />
                    Insert
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuGroup>
                    <DropdownMenuLabel>Pauses</DropdownMenuLabel>
                    <DropdownMenuItem onSelect={() => insert('[pause]')}>
                      Default pause <span className="ml-auto text-muted-foreground">[pause]</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onSelect={() => insert('[pause=1.5]')}>
                      1.5 second pause
                    </DropdownMenuItem>
                  </DropdownMenuGroup>
                  <DropdownMenuSeparator />
                  <DropdownMenuGroup>
                    <DropdownMenuLabel>
                      {reactions ? 'Reactions' : 'Reactions need Turbo or Nano'}
                    </DropdownMenuLabel>
                    {reactionTags.map((tag) => (
                      <DropdownMenuItem
                        key={tag}
                        disabled={!reactions}
                        onSelect={() => insert(`[${tag}]`)}
                      >
                        {tag.charAt(0).toUpperCase() + tag.slice(1)}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuGroup>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
          <Textarea
            ref={editor}
            variant="script"
            id="narrate-script"
            value={draft}
            className="h-96 resize-y"
            placeholder="Write or paste the words you want to bring to life…"
            aria-describedby="narrate-script-help"
            onChange={(event) => changeText(event.target.value)}
            onBlur={() => notify('Edit script clicked')}
            onSelect={() => {
              if (editor.current)
                selection.current = {
                  start: editor.current.selectionStart,
                  end: editor.current.selectionEnd
                }
            }}
            onKeyDown={(event) => {
              if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
                event.preventDefault()
                onGenerate()
              }
            }}
          />
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs tabular-nums text-muted-foreground">
              {draft.length.toLocaleString()} characters <span aria-hidden="true">·</span>{' '}
              {words.toLocaleString()} words
            </p>
            <Button variant="ghost" size="sm" onClick={inspect}>
              <Timer data-icon="inline-start" aria-hidden="true" />
              Inspect text and parts
            </Button>
          </div>
          <FieldDescription id="narrate-script-help">
            Cleanup applies to generation. Your original script stays here.
          </FieldDescription>
        </Field>
      </FieldGroup>
      <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="link" size="sm" onClick={() => insert('[pause]')}>
              Add a pause
            </Button>
          </TooltipTrigger>
          <TooltipContent>Use [pause] or [pause=1.5]. SSML is not supported.</TooltipContent>
        </Tooltip>
        <span>Generate with {window.api.platform === 'darwin' ? '⌘' : 'Ctrl'} + Enter</span>
      </div>
    </section>
  )
})
