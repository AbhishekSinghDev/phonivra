import { notify, notifyError } from '@/lib/notify'
import { useStudioStore } from '@/stores/studio-store'
import { controlPlayback, reconcilePlayback } from '@/lib/playback'
import { maxTextLength } from '../../../shared/contract'
import type { GenerationSettings, StudioCommand, StudioUpdate } from '../../../shared/studio'

function dispatch(command: StudioCommand): Promise<StudioUpdate> {
  return window.api.studio.dispatch(command, useStudioStore.getState().snapshot?.outputsRevision)
}

function acceptStudioUpdate(snapshot: StudioUpdate): boolean {
  const previous = useStudioStore.getState().snapshot
  useStudioStore.getState().accept(snapshot)
  const accepted = useStudioStore.getState().snapshot
  if (!accepted || accepted === previous) return false
  if (
    accepted.outputs !== previous?.outputs ||
    accepted.voices !== previous?.voices ||
    accepted.preview?.id !== previous?.preview?.id
  ) {
    reconcilePlayback()
  }
  return true
}

async function receive(request: Promise<StudioUpdate>, reportStatus = false): Promise<boolean> {
  try {
    const snapshot = await request
    acceptStudioUpdate(snapshot)
    if (reportStatus && snapshot.status) {
      if (snapshot.statusIsError) notifyError(snapshot.status)
      else notify(snapshot.status)
    }
    return !snapshot.statusIsError
  } catch (error) {
    const message = error instanceof Error ? error.message : 'The action could not be completed.'
    useStudioStore.getState().setError(message)
    notifyError(message)
    return false
  }
}
type DraftCommand = 'script.update' | 'batch.text'
type PendingDraft = {
  value: { text: string } | null
  timer: ReturnType<typeof setTimeout> | null
  write: Promise<boolean> | null
}
const drafts: Record<DraftCommand, PendingDraft> = {
  'script.update': { value: null, timer: null, write: null },
  'batch.text': { value: null, timer: null, write: null }
}
export const draftLimitMessage = `Shorten this draft to ${maxTextLength.toLocaleString()} characters to save it.`

async function writeDraft(type: DraftCommand, draft: PendingDraft): Promise<boolean> {
  while (draft.value) {
    const value = draft.value
    if (value.text.length > maxTextLength) return false
    const saved = await receive(dispatch({ type, text: value.text }), true)
    if (draft.value !== value) continue
    if (!saved) return false
    draft.value = null
  }
  return true
}

function flushDraft(type: DraftCommand): Promise<boolean> {
  const draft = drafts[type]
  if (draft.timer) clearTimeout(draft.timer)
  draft.timer = null
  if (!draft.write) {
    draft.write = writeDraft(type, draft).finally(() => {
      draft.write = null
    })
  }
  return draft.write
}

export function flushScriptDraft(): Promise<boolean> {
  return flushDraft('script.update')
}

function editDraft(type: DraftCommand, text: string): void {
  const draft = drafts[type]
  draft.value = { text }
  if (draft.timer) clearTimeout(draft.timer)
  draft.timer = setTimeout(() => void flushDraft(type), 200)
}
export function editBatchText(text: string): void {
  editDraft('batch.text', text)
}
export function act(label: string, command: StudioCommand): Promise<void> {
  if (command.type === 'playback.toggle' || command.type === 'playback.seek') {
    return controlPlayback(command).catch((error: unknown) => {
      notifyError(error instanceof Error ? error.message : `${label} failed.`)
    })
  }
  return dispatchStudioCommand(command).then(() => undefined)
}

export async function dispatchStudioCommand(command: StudioCommand): Promise<boolean> {
  const draft = requiredDraft(command)
  if (draft && !(await flushDraft(draft))) {
    if ((drafts[draft].value?.text.length ?? 0) > maxTextLength) notifyError(draftLimitMessage)
    return false
  }
  return receive(dispatch(command), true)
}

function requiredDraft(command: StudioCommand): DraftCommand | null {
  switch (command.type) {
    case 'script.inspect':
    case 'script.import':
    case 'project.open':
    case 'project.save':
      return 'script.update'
    case 'batch.prepare':
    case 'batch.start':
    case 'batch.import':
      return 'batch.text'
    case 'job.start':
      if (command.kind === 'batch') return 'batch.text'
      if (command.kind === 'narration') return 'script.update'
      return null
    default:
      return null
  }
}

// Keep typing synchronous locally, and coalesce IPC snapshots. Actions flush the
// latest draft before generating, inspecting, importing or saving a project.
export function editScript(text: string): void {
  editDraft('script.update', text)
}
export function updateSettings<K extends keyof GenerationSettings>(
  key: K,
  value: GenerationSettings[K]
): void {
  const state = useStudioStore.getState().snapshot
  if (state)
    act('Change setting', {
      type: 'settings.update',
      settings: { ...state.settings, [key]: value }
    })
}
export async function retryStudioConnection(): Promise<void> {
  useStudioStore.getState().setError(null)
  await receive(window.api.studio.getSnapshot())
}

export function registerDraftClose(): void {
  window.api.studio.onDraftClose(
    async () => {
      if (document.activeElement instanceof HTMLElement) document.activeElement.blur()
      document.body.inert = true
      const saved = await Promise.all([flushScriptDraft(), flushDraft('batch.text')])
      return saved.every(Boolean)
    },
    () => {
      document.body.inert = false
    }
  )
}

export function connectStudio(): () => void {
  const unsubscribe = window.api.studio.onChange((snapshot) => {
    const previous = useStudioStore.getState().snapshot
    if (!acceptStudioUpdate(snapshot)) return
    if (snapshot.statusIsError && snapshot.status && snapshot.status !== previous?.status)
      notifyError(snapshot.status)
    if (snapshot.job.phase === 'error' && previous?.job.phase !== 'error')
      notifyError(snapshot.job.message)
    const task = snapshot.maintenance
    if (
      task &&
      (task.id !== previous?.maintenance?.id || task.phase !== previous.maintenance.phase)
    ) {
      if (task.phase === 'error') notifyError(task.message)
      if (task.phase === 'complete' && task.title === 'Export audio files') notify('File exported.')
    }
  })
  void receive(window.api.studio.getSnapshot())
  return unsubscribe
}
