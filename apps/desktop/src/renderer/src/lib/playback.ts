import { mediaOrigin } from '../../../shared/contract'
import { notifyError } from '@/lib/notify'
import { useStudioStore } from '@/stores/studio-store'
import type { StudioCommand } from '../../../shared/studio'

// One audio element survives route changes and prevents overlapping voice/output playback.
let audio: HTMLAudioElement | null = null
let currentId: string | null = null
let lastReport = 0

function report(): void {
  if (!audio) return
  void window.api.studio
    .reportPlayback({
      outputId: currentId,
      playing: !audio.paused && !audio.ended,
      position: Number.isFinite(audio.currentTime) ? audio.currentTime : 0
    })
    .catch((error: unknown) =>
      notifyError(error instanceof Error ? error.message : 'Playback status could not be updated.')
    )
}

function player(): HTMLAudioElement {
  if (audio) return audio
  audio = new Audio()
  audio.preload = 'metadata'
  for (const event of ['play', 'pause', 'ended', 'seeked']) audio.addEventListener(event, report)
  audio.addEventListener('timeupdate', () => {
    if (performance.now() - lastReport > 200) {
      lastReport = performance.now()
      report()
    }
  })
  audio.addEventListener('error', () => {
    audio?.pause()
    report()
    notifyError('This audio could not be played. Refresh the library or generate a new preview.')
  })
  return audio
}

function select(id: string): HTMLAudioElement {
  const element = player()
  if (currentId !== id) {
    element.pause()
    currentId = id
    element.src = `${mediaOrigin}/${encodeURIComponent(id)}`
    element.load()
  }
  return element
}

export async function controlPlayback(
  command: Extract<StudioCommand, { type: 'playback.toggle' | 'playback.seek' }>
): Promise<void> {
  const id = command.id ?? currentId
  if (!id) return
  const element = select(id)
  if (command.type === 'playback.toggle') {
    if (element.paused) await element.play()
    else element.pause()
  } else {
    const seek = (): void => {
      element.currentTime = Math.min(
        command.seconds,
        Number.isFinite(element.duration) ? element.duration : command.seconds
      )
      report()
    }
    if (element.readyState >= HTMLMediaElement.HAVE_METADATA) seek()
    else element.addEventListener('loadedmetadata', seek, { once: true })
  }
  report()
}

export function reconcilePlayback(): void {
  if (!audio || !currentId) return
  const snapshot = useStudioStore.getState().snapshot
  if (!snapshot) return
  const exists =
    currentId === snapshot.preview?.id ||
    snapshot.outputs.some((output) => output.id === currentId) ||
    snapshot.voices.some((voice) => `voice:${voice.id}` === currentId)
  if (!exists) {
    audio.pause()
    audio.removeAttribute('src')
    audio.load()
    currentId = null
    report()
  }
}
