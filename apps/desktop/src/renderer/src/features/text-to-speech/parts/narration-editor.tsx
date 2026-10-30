import { memo, useDeferredValue, useEffect, useMemo, useRef, useState } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  ChevronDownIcon,
  FileCodeIcon,
  FileUpIcon,
  FolderOpenIcon,
  PlusIcon,
  RotateCcwIcon,
  SaveIcon,
  TimerIcon
} from '@hugeicons/core-free-icons'
import { Button } from '@phonivra/ui/components/button'
import { Field, FieldDescription, FieldGroup, FieldLabel } from '@phonivra/ui/components/field'
import { Textarea } from '@phonivra/ui/components/textarea'
import { Input } from '@phonivra/ui/components/input'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@phonivra/ui/components/dropdown-menu'
import { act, editScript, flushScriptDraft, updateSettings } from '@/lib/actions'
import { RestoreDefaults } from '@/components/studio/restore-defaults'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from '@phonivra/ui/components/alert-dialog'
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
  const [replacement, setReplacement] = useState<'script.import' | 'project.open' | null>(null)
  const modifier = window.api.platform === 'darwin' ? '⌘' : 'Ctrl'
  function replaceDocument(type: 'script.import' | 'project.open'): void {
    if (draft.trim() || type === 'project.open') setReplacement(type)
    else void act('Import script', { type })
  }
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
    <section
      aria-label="Narration script"
      className="script-document flex min-w-0 flex-col"
      onKeyDown={(event) => {
        if (
          !(event.metaKey || event.ctrlKey) ||
          event.altKey ||
          event.shiftKey ||
          event.nativeEvent.isComposing
        )
          return
        const key = event.key.toLowerCase()
        if (key === 's') {
          event.preventDefault()
          void act('Save project', { type: 'project.save' })
        }
        if (key === 'o') {
          event.preventDefault()
          replaceDocument('project.open')
        }
      }}
    >
      <FieldGroup className="gap-0">
        <Field className="px-6 pt-6 pb-4">
          <FieldLabel className="sr-only" htmlFor="narrate-title">
            Title
          </FieldLabel>
          <div className="flex min-w-0 items-center gap-3">
            <Input
              className="h-10 min-w-0 flex-1 px-0"
              id="narrate-title"
              value={title}
              maxLength={120}
              placeholder="Untitled narration"
              onChange={(event) => updateSettings('title', event.target.value)}
            />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" onClick={() => notify('Project menu clicked')}>
                  <HugeiconsIcon icon={FileCodeIcon} data-icon="inline-start" aria-hidden="true" />
                  Project
                  <HugeiconsIcon icon={ChevronDownIcon} data-icon="inline-end" aria-hidden="true" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuGroup>
                  <DropdownMenuItem onSelect={() => act('Save project', { type: 'project.save' })}>
                    <HugeiconsIcon icon={SaveIcon} aria-hidden="true" />
                    Save project <span className="ml-auto text-muted-foreground">{modifier}+S</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onSelect={() => replaceDocument('project.open')}>
                    <HugeiconsIcon icon={FolderOpenIcon} aria-hidden="true" />
                    Open project JSON{' '}
                    <span className="ml-auto text-muted-foreground">{modifier}+O</span>
                  </DropdownMenuItem>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                  <RestoreDefaults>
                    <DropdownMenuItem onSelect={(event) => event.preventDefault()}>
                      <HugeiconsIcon icon={RotateCcwIcon} aria-hidden="true" />
                      Restore generation defaults
                    </DropdownMenuItem>
                  </RestoreDefaults>
                </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </Field>
        <Field className="gap-0">
          <div className="flex flex-wrap items-center justify-between gap-2 border-y border-border/60 px-6 py-2">
            <FieldLabel className="text-xs text-muted-foreground" htmlFor="narrate-script">
              Your script
            </FieldLabel>
            <div className="flex items-center gap-1">
              <Button size="sm" variant="ghost" onClick={() => replaceDocument('script.import')}>
                <HugeiconsIcon icon={FileUpIcon} data-icon="inline-start" aria-hidden="true" />
                Import script
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button size="sm" variant="ghost" onClick={() => notify('Insert menu clicked')}>
                    <HugeiconsIcon icon={PlusIcon} data-icon="inline-start" aria-hidden="true" />
                    Script tools
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuGroup>
                    <DropdownMenuItem onSelect={inspect}>
                      <HugeiconsIcon icon={TimerIcon} aria-hidden="true" />
                      Inspect text and parts
                    </DropdownMenuItem>
                  </DropdownMenuGroup>
                  <DropdownMenuSeparator />
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
            className="h-72 min-h-64 resize-y px-6 py-5 xl:h-80"
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
          <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-4">
            <p className="text-xs tabular-nums text-muted-foreground">
              {draft.length.toLocaleString()} characters <span aria-hidden="true">·</span>{' '}
              {words.toLocaleString()} words
            </p>
            <span className="text-xs text-muted-foreground">
              {window.api.platform === 'darwin' ? '⌘' : 'Ctrl'} + Enter to generate
            </span>
          </div>
          <FieldDescription className="sr-only" id="narrate-script-help">
            Cleanup applies to generation. Your original script stays here.
          </FieldDescription>
        </Field>
      </FieldGroup>
      <AlertDialog
        open={replacement !== null}
        onOpenChange={(open) => {
          if (!open) setReplacement(null)
        }}
      >
        <AlertDialogContent
          onCloseAutoFocus={(event) => {
            event.preventDefault()
            editor.current?.focus()
          }}
        >
          <AlertDialogHeader>
            <AlertDialogTitle>
              {replacement === 'project.open' ? 'Open another project?' : 'Replace your script?'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {replacement === 'project.open'
                ? 'Opening a project replaces your script, generation settings and dictionary. Save your current project first if you want to keep it.'
                : 'Importing a script replaces the text currently in the editor. Save your project first if you want to keep it.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep current work</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (replacement)
                  void act(replacement === 'project.open' ? 'Open project' : 'Import script', {
                    type: replacement
                  })
              }}
            >
              {replacement === 'project.open' ? 'Open project' : 'Replace script'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  )
})
