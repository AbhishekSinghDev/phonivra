import { clipboard, dialog, shell, systemPreferences } from 'electron'
import { basename, extname } from 'node:path'
import { EngineClient } from './engine-client'
import { readCredential, saveCredential, removeCredential } from './credentials'
import { audioExtensions, scriptExtensions } from '../shared/contract'
import type { StudioCommand, StudioSnapshot } from '../shared/studio'

const scriptFilters = [{ name: 'Scripts', extensions: scriptExtensions }]
const audioFilters = [{ name: 'Audio', extensions: audioExtensions }]

/** Native dialogs and transport adaptation, without any synthesis or filesystem business logic. */
export class LocalStudio {
  private readonly engine = new EngineClient()
  private state: StudioSnapshot | null = null
  private engineRevision = -1
  private revision = 0
  private timer: ReturnType<typeof setTimeout> | null = null
  private disposed = false
  private initialized = false
  private engineGeneration = 0
  private initializePromise: Promise<void> | null = null
  private playback: StudioSnapshot['playback'] = { playing: false, position: 0, outputId: null }
  constructor(private readonly publish: (snapshot: StudioSnapshot) => void) {}

  private accept(snapshot: StudioSnapshot): StudioSnapshot {
    if (snapshot.revision <= this.engineRevision && this.state) return this.state
    this.engineRevision = snapshot.revision
    this.state = { ...snapshot, revision: ++this.revision, playback: this.playback }
    this.publish(this.state)
    return this.state
  }

  private async initialize(): Promise<void> {
    await this.engine.start()
    if (this.initialized && this.engineGeneration === this.engine.generation) return
    if (!this.initializePromise) {
      this.initializePromise = (async () => {
        this.engineRevision = -1
        this.engineGeneration = this.engine.generation
        let token: string | null = null
        let warning: unknown = null
        try {
          token = await readCredential()
        } catch (error) {
          warning = error
        }
        const snapshot = await this.engine.snapshot('/desktop', {
          operation: 'credential.restore',
          token
        })
        if (snapshot) this.accept(snapshot)
        this.initialized = true
        if (warning) this.fail(warning)
        if (!this.timer) this.poll()
      })().catch((error: unknown) => {
        this.initializePromise = null
        throw error
      })
    }
    await this.initializePromise
    this.initializePromise = null
  }

  private poll(): void {
    if (this.disposed) return
    this.timer = setTimeout(
      () => {
        void (async () => {
          try {
            await this.initialize()
            const snapshot = await this.engine.snapshot(`/snapshot?after=${this.engineRevision}`)
            if (snapshot) this.accept(snapshot)
          } catch (error) {
            this.fail(error)
          } finally {
            this.poll()
          }
        })()
      },
      this.state && ['idle', 'complete', 'error', 'stopped'].includes(this.state.job.phase)
        ? 1500
        : 300
    )
  }

  private fail(error: unknown): StudioSnapshot {
    if (!this.state) throw error
    this.state = {
      ...this.state,
      revision: ++this.revision,
      statusIsError: true,
      status: error instanceof Error ? error.message : 'The action failed.'
    }
    this.publish(this.state)
    return this.state
  }

  async snapshot(): Promise<StudioSnapshot> {
    await this.initialize()
    const snapshot = await this.engine.snapshot()
    if (!snapshot) throw new Error('The engine returned an empty snapshot.')
    return this.accept(snapshot)
  }

  async dispatch(command: StudioCommand): Promise<StudioSnapshot> {
    await this.initialize()
    try {
      const native = await this.nativeCommand(command)
      if (native) return native
      const snapshot = await this.engine.snapshot('/command', command)
      if (!snapshot) throw new Error('The engine returned an empty command result.')
      return this.accept(snapshot)
    } catch (error) {
      return this.fail(error)
    }
  }

  private async desktop(body: object): Promise<StudioSnapshot> {
    const snapshot = await this.engine.snapshot('/desktop', body)
    if (!snapshot) throw new Error('The engine returned an empty desktop result.')
    return this.accept(snapshot)
  }

  private async nativeCommand(command: StudioCommand): Promise<StudioSnapshot | null> {
    switch (command.type) {
      case 'script.import':
      case 'project.open':
      case 'batch.import':
      case 'reference.attach': {
        if (command.type === 'reference.attach' && command.source === 'record') {
          if (
            process.platform === 'darwin' &&
            !(await systemPreferences.askForMediaAccess('microphone'))
          ) {
            throw new Error('Allow microphone access in System Settings or upload a recording.')
          }
          return null
        }
        if (command.type === 'reference.attach' && this.state?.reference.status === 'recording')
          return null
        const result = await dialog.showOpenDialog({
          title:
            command.type === 'reference.attach'
              ? 'Choose voice reference'
              : 'Open script or project',
          properties:
            command.type === 'batch.import' ? ['openFile', 'multiSelections'] : ['openFile'],
          filters:
            command.type === 'reference.attach'
              ? audioFilters
              : command.type === 'project.open'
                ? [{ name: 'Phonivra project', extensions: ['json'] }]
                : scriptFilters
        })
        if (result.canceled) return this.state
        return this.desktop({
          operation: command.type === 'reference.attach' ? 'reference.import' : command.type,
          paths: result.filePaths
        })
      }
      case 'project.save': {
        const title = this.state?.settings.title.replace(/[<>:"/\\|?*]/g, '-').trim() || 'Untitled'
        const result = await dialog.showSaveDialog({
          title: 'Save Phonivra project',
          defaultPath: `${title}.phonivra.json`,
          filters: [{ name: 'Phonivra project', extensions: ['json'] }]
        })
        if (result.canceled || !result.filePath) return this.state
        return this.desktop({ operation: command.type, paths: [result.filePath] })
      }
      case 'output.export': {
        const output = this.state?.outputs.find((item) => item.id === command.id)
        const batch = command.id === 'batch' && command.format === 'zip'
        if (!output && !batch) throw new Error('Select a saved narration first.')
        const extension = command.format === 'audio' ? output!.format : command.format
        const name = batch
          ? 'phonivra-batch.zip'
          : `${basename(output!.filename, extname(output!.filename))}.${extension}`
        const result = await dialog.showSaveDialog({
          title: 'Export narration',
          defaultPath: name,
          filters: [{ name: extension.toUpperCase(), extensions: [extension] }]
        })
        if (result.canceled || !result.filePath) return this.state
        return this.desktop({
          operation: command.type,
          paths: [result.filePath],
          id: command.id,
          format: command.format
        })
      }
      case 'storage.choose': {
        const result = await dialog.showOpenDialog({
          title: 'Choose model storage folder',
          properties: ['openDirectory', 'createDirectory']
        })
        if (result.canceled) return this.state
        return this.desktop({ operation: command.type, paths: result.filePaths })
      }
      case 'folder.open':
      case 'storage.open':
      case 'logs.open': {
        const response = await this.engine.request('/paths')
        const paths = (await response.json()) as Record<string, string>
        const key =
          command.type === 'folder.open'
            ? 'outputs'
            : command.type === 'storage.open'
              ? 'models'
              : 'logs'
        const error = await shell.openPath(paths[key])
        if (error) throw new Error(error)
        return this.state
      }
      case 'diagnostics.copy':
        clipboard.writeText(
          JSON.stringify(
            {
              device: this.state?.device,
              dependencies: this.state?.dependencies,
              job: this.state?.job,
              logs: this.state?.configuration.preferences.logs
            },
            null,
            2
          )
        )
        return this.state
      case 'credentials.set':
        await saveCredential(command.token)
        return null
      case 'credentials.remove':
        await removeCredential()
        return null
      case 'playback.toggle':
      case 'playback.seek':
        throw new Error('Playback must be controlled by the desktop audio session.')
      default:
        return null
    }
  }

  reportPlayback(playback: StudioSnapshot['playback']): void {
    this.playback = playback
    if (this.state) {
      this.state = { ...this.state, revision: ++this.revision, playback }
      this.publish(this.state)
    }
  }

  async waveform(id: string): Promise<number[]> {
    await this.initialize()
    const response = await this.engine.request(`/waveform/${encodeURIComponent(id)}`)
    const data: unknown = await response.json()
    if (
      !Array.isArray(data) ||
      data.length > 1000 ||
      !data.every((peak) => typeof peak === 'number' && Number.isFinite(peak))
    )
      throw new Error('Invalid waveform data.')
    return data
  }

  async media(request: Request): Promise<Response> {
    const url = new URL(request.url)
    if (!['GET', 'HEAD'].includes(request.method)) return new Response(null, { status: 403 })
    try {
      const id = decodeURIComponent(url.pathname.slice(1))
      if (!id || id.length > 256) return new Response(null, { status: 400 })
      const headers: Record<string, string> = {}
      const range = request.headers.get('range')
      if (range) headers.Range = range
      await this.initialize()
      return await this.engine.request(
        `/media/${encodeURIComponent(id)}`,
        undefined,
        headers,
        request.signal,
        request.method === 'HEAD' ? 'HEAD' : 'GET'
      )
    } catch {
      return new Response(null, { status: 404 })
    }
  }

  dispose(): Promise<void> {
    this.disposed = true
    if (this.timer) clearTimeout(this.timer)
    return this.engine.dispose()
  }
}
