import { notify, notifyError } from '@/lib/notify'
import { useStudioStore } from '@/stores/studio-store'
import type { GenerationSettings, StudioCommand, StudioSnapshot } from '../../../shared/studio'

async function receive(request: Promise<StudioSnapshot>, reportStatus = false): Promise<void> {
  try {
    const snapshot = await request
    useStudioStore.getState().accept(snapshot)
    if (reportStatus && snapshot.status) {
      if (snapshot.statusIsError) notifyError(snapshot.status)
      else notify(snapshot.status)
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'The action could not be completed.'
    useStudioStore.getState().setError(message)
    notifyError(message)
  }
}
let pendingScript: string | null = null
let pendingBatchText: string | null = null
let scriptTimer: ReturnType<typeof setTimeout> | null = null
let scriptWrite: Promise<void> = Promise.resolve()

export function flushScriptDraft(): Promise<void> {
  if (scriptTimer) clearTimeout(scriptTimer)
  scriptTimer = null
  if (pendingScript !== null) {
    const text = pendingScript
    pendingScript = null
    scriptWrite = scriptWrite.then(() =>
      receive(window.api.studio.dispatch({ type: 'script.update', text }))
    )
  }
  if (pendingBatchText !== null) {
    const text = pendingBatchText
    pendingBatchText = null
    scriptWrite = scriptWrite.then(() =>
      receive(window.api.studio.dispatch({ type: 'batch.text', text }))
    )
  }
  return scriptWrite
}
export function editBatchText(text: string): void {
  pendingBatchText = text
  if (scriptTimer) clearTimeout(scriptTimer)
  scriptTimer = setTimeout(() => {
    void flushScriptDraft()
  }, 200)
}
export function act(label: string, command: StudioCommand): Promise<void> {
  notify(`${label} clicked`)
  return flushScriptDraft().then(() => receive(window.api.studio.dispatch(command), true))
}
// Keep typing synchronous locally, and coalesce IPC snapshots. Actions flush the
// latest draft before generating, inspecting, importing or saving a project.
export function editScript(text: string): void {
  pendingScript = text
  if (scriptTimer) clearTimeout(scriptTimer)
  scriptTimer = setTimeout(() => {
    void flushScriptDraft()
  }, 200)
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
export function connectStudio(): () => void {
  const unsubscribe = window.api.studio.onChange((snapshot) => {
    const previous = useStudioStore.getState().snapshot
    if (previous && previous.revision >= snapshot.revision) return
    useStudioStore.getState().accept(snapshot)
    if (snapshot.statusIsError && snapshot.status && snapshot.status !== previous?.status)
      notifyError(snapshot.status)
    if (snapshot.job.phase === 'error' && previous?.job.phase !== 'error')
      notifyError(snapshot.job.message)
  })
  void receive(window.api.studio.getSnapshot())
  return unsubscribe
}
