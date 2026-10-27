import { notify } from '@/lib/notify'
import { useStudioStore } from '@/stores/studio-store'
import type { GenerationSettings, StudioCommand, StudioSnapshot } from '../../../shared/studio'

async function receive(request: Promise<StudioSnapshot>): Promise<void> {
  try {
    useStudioStore.getState().accept(await request)
  } catch (error) {
    useStudioStore
      .getState()
      .setError(error instanceof Error ? error.message : 'The action could not be completed.')
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
  return flushScriptDraft().then(() => receive(window.api.studio.dispatch(command)))
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
export const reviewActions = {
  scenario: (id: string): void => {
    notify('Review scenario clicked')
    void flushScriptDraft().then(() => receive(window.api.review.selectScenario(id)))
  },
  advance: (): void => {
    notify('Advance progress clicked')
    void receive(window.api.review.advance())
  },
  pause: (paused: boolean): void => {
    notify('Pause simulation clicked')
    void receive(window.api.review.setPaused(paused))
  },
  reset: (): void => {
    notify('Reset simulation clicked')
    void flushScriptDraft().then(() => receive(window.api.review.reset()))
  }
}
export function connectStudio(): () => void {
  const unsubscribe = window.api.studio.onChange((snapshot) =>
    useStudioStore.getState().accept(snapshot)
  )
  void receive(window.api.studio.getSnapshot())
  return unsubscribe
}
