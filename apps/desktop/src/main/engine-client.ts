import { app } from 'electron'
import { spawn, type ChildProcessWithoutNullStreams } from 'node:child_process'
import { randomBytes } from 'node:crypto'
import { existsSync, mkdirSync, createWriteStream } from 'node:fs'
import { dirname, isAbsolute, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { loopbackHost, protocolVersion } from '../shared/contract'
import type { StudioSnapshot } from '../shared/studio'

const here = dirname(fileURLToPath(import.meta.url))

function isSnapshot(value: unknown): value is StudioSnapshot {
  if (!value || typeof value !== 'object') return false
  const state = value as Partial<StudioSnapshot>
  return (
    Number.isInteger(state.revision) &&
    typeof state.setup?.complete === 'boolean' &&
    typeof state.setup.resuming === 'boolean' &&
    typeof state.setup.mediaReady === 'boolean' &&
    (state.setup.freeBytes === null || Number.isSafeInteger(state.setup.freeBytes)) &&
    !!state.setup.modelSizes &&
    Object.values(state.setup.modelSizes).every(
      (size) => size === null || (Number.isSafeInteger(size) && size > 0)
    ) &&
    typeof state.script === 'string' &&
    typeof state.dictionary === 'string' &&
    !!state.settings &&
    !!state.job &&
    !!state.reference &&
    !!state.configuration &&
    !!state.batch &&
    !!state.playback &&
    !!state.device &&
    !!state.dependencies &&
    Array.isArray(state.voices) &&
    Array.isArray(state.outputs) &&
    Array.isArray(state.models) &&
    Array.isArray(state.units)
  )
}

/** Owns the private process and transport. The renderer never sees ports or credentials. */
export class EngineClient {
  private child: ChildProcessWithoutNullStreams | null = null
  private starting: Promise<void> | null = null
  private baseURL = ''
  private secret = ''
  private closed = false
  generation = 0
  private readonly root = app.getPath('userData')

  async start(): Promise<void> {
    if (this.closed) throw new Error('Phonivra is shutting down.')
    if (this.baseURL) return
    if (!this.starting) {
      this.starting = this.launch().catch((error: unknown) => {
        this.starting = null
        throw error
      })
    }
    await this.starting
  }

  private launch(): Promise<void> {
    const engine = app.isPackaged
      ? join(process.resourcesPath, 'engine')
      : resolve(here, '../../../engine')
    const executable = process.platform === 'win32' ? 'python.exe' : 'bin/python3'
    const bundledPython = app.isPackaged
      ? join(engine, 'python', executable)
      : join(engine, '.venv', process.platform === 'win32' ? 'Scripts/python.exe' : 'bin/python')
    const override = app.isPackaged ? undefined : process.env.PHONIVRA_PYTHON
    const python = override || bundledPython
    if (!isAbsolute(python) || !existsSync(python)) {
      if (override) throw new Error('PHONIVRA_PYTHON must point to an existing absolute path.')
      throw new Error(
        app.isPackaged
          ? 'The bundled speech runtime is missing. Reinstall Phonivra.'
          : 'The engine runtime is missing. Run pnpm engine:setup and retry.'
      )
    }
    mkdirSync(join(this.root, 'logs'), { recursive: true })
    this.secret = randomBytes(32).toString('hex')
    const env = { ...process.env }
    if (app.isPackaged) {
      for (const key of Object.keys(env)) {
        if (/^(?:HF_|HUGGINGFACE_|TORCH_FORCE_|PHONIVRA_MEDIA_DIR$)/i.test(key)) delete env[key]
      }
      env.PHONIVRA_MEDIA_DIR = join(engine, 'media')
    }
    const child = spawn(python, ['-I', '-u', '-m', 'phonivra_engine'], {
      cwd: engine,
      env,
      windowsHide: true,
      stdio: ['pipe', 'pipe', 'pipe']
    })
    this.child = child
    const log = createWriteStream(join(this.root, 'logs', 'engine-startup.log'), {
      flags: 'w',
      mode: 0o600
    })
    log.on('error', () => {
      // A full or inaccessible log directory must not terminate the main process.
    })
    let logBytes = 0
    child.stderr.on('data', (chunk: Buffer) => {
      const writable = Math.min(chunk.length, 2_000_000 - logBytes)
      if (writable > 0 && !log.destroyed) {
        log.write(chunk.subarray(0, writable))
        logBytes += writable
      }
    })
    child.once('close', () => log.end())
    return new Promise((resolveStart, rejectStart) => {
      let buffer = ''
      let settled = false
      const timeout = setTimeout(() => {
        if (settled) return
        settled = true
        child.kill('SIGKILL')
        rejectStart(
          new Error('The engine did not start within 90 seconds. See the local engine logs.')
        )
      }, 90_000)
      child.stdout.on('data', (chunk: Buffer) => {
        buffer += chunk.toString()
        if (buffer.length > 1_000_000) buffer = buffer.slice(-100_000)
        let newline: number
        while ((newline = buffer.indexOf('\n')) !== -1) {
          const line = buffer.slice(0, newline)
          buffer = buffer.slice(newline + 1)
          try {
            const message: unknown = JSON.parse(line)
            if (
              message &&
              typeof message === 'object' &&
              'phonivraEngine' in message &&
              message.phonivraEngine === protocolVersion &&
              'port' in message &&
              typeof message.port === 'number' &&
              Number.isInteger(message.port) &&
              message.port > 0 &&
              message.port < 65536 &&
              !settled
            ) {
              this.baseURL = `http://${loopbackHost}:${message.port}`
              this.generation += 1
              settled = true
              clearTimeout(timeout)
              resolveStart()
            }
          } catch {
            // Upstream libraries may write informational lines to stdout.
          }
        }
      })
      child.stdin.on('error', () => {
        // The exit/error handler reports a process that could not receive bootstrap input.
      })
      child.once('error', (error) => {
        clearTimeout(timeout)
        if (!settled) {
          settled = true
          rejectStart(new Error(`Could not start the local engine: ${error.message}`))
        }
      })
      child.once('exit', () => {
        clearTimeout(timeout)
        if (this.child === child) {
          this.child = null
          this.baseURL = ''
          this.starting = null
        }
        if (!settled) {
          settled = true
          rejectStart(
            new Error(
              'The local engine exited during startup. Check logs/engine-startup.log in Phonivra application data.'
            )
          )
        }
      })
      child.stdin.write(`${JSON.stringify({ root: this.root, secret: this.secret })}\n`)
    })
  }

  async request(
    path: string,
    body?: unknown,
    headers: Record<string, string> = {},
    signal = AbortSignal.timeout(120_000),
    readMethod: 'GET' | 'HEAD' = 'GET'
  ): Promise<Response> {
    await this.start()
    if (this.closed) throw new Error('Phonivra is shutting down.')
    const response = await fetch(`${this.baseURL}${path}`, {
      method: body === undefined ? readMethod : 'POST',
      headers: {
        ...headers,
        Authorization: `Bearer ${this.secret}`,
        ...(body === undefined ? {} : { 'Content-Type': 'application/json' })
      },
      body: body === undefined ? undefined : JSON.stringify(body),
      signal,
      redirect: 'error'
    })
    if (!response.ok) {
      const error = (await response.json().catch(() => null)) as { detail?: unknown } | null
      throw new Error(
        typeof error?.detail === 'string'
          ? error.detail
          : `Engine request failed (${response.status}).`
      )
    }
    return response
  }

  async snapshot(path = '/snapshot', body?: unknown): Promise<StudioSnapshot | null> {
    const response = await this.request(path, body)
    if (response.status === 204) return null
    const value: unknown = await response.json()
    if (!isSnapshot(value))
      throw new Error('The local engine returned an incompatible studio snapshot.')
    return value
  }

  async dispose(): Promise<void> {
    this.closed = true
    const child = this.child
    if (!child || child.exitCode !== null || child.signalCode !== null) return
    await new Promise<void>((done) => {
      const timeout = setTimeout(() => {
        child.kill('SIGKILL')
        done()
      }, 8000)
      child.once('close', () => {
        clearTimeout(timeout)
        done()
      })
      child.stdin.end()
    })
  }
}
