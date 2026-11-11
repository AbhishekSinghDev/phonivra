/// <reference types="electron-vite/node" />

import { appOrigin, devRendererOrigin, mediaOrigin } from '../shared/contract'
import { LocalStudio } from './local-studio'
import appIcon from '../../public/logos/phonivra-icon.png?asset'
import { validateCommand } from '../shared/validation'
import { app, BrowserWindow, ipcMain, nativeTheme, shell, net, protocol, session } from 'electron'
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { join, dirname, resolve, relative, isAbsolute, sep } from 'node:path'
import { realpath } from 'node:fs/promises'
import { fileURLToPath, pathToFileURL } from 'node:url'
import type { Theme, ThemeState, WindowAction } from '../shared/api'

const here = dirname(fileURLToPath(import.meta.url))
const primaryInstance = app.requestSingleInstanceLock()
if (!primaryInstance) app.quit()
app.on('second-instance', () => {
  const window = BrowserWindow.getAllWindows()[0]
  if (!window) return
  if (window.isMinimized()) window.restore()
  window.show()
  window.focus()
})
protocol.registerSchemesAsPrivileged([
  {
    scheme: new URL(appOrigin).protocol.slice(0, -1),
    privileges: {
      standard: true,
      secure: true,
      stream: true,
      supportFetchAPI: true,
      corsEnabled: true
    }
  }
])
const rendererPartition = 'phonivra-studio'
const rendererDirectory = join(here, '../renderer')
const studioWindows = new Set<BrowserWindow>()
const devURL = !app.isPackaged ? process.env.ELECTRON_RENDERER_URL : undefined

async function serveRenderer(request: Request, url: URL): Promise<Response> {
  if (request.method !== 'GET') return new Response(null, { status: 405 })
  try {
    const root = await realpath(rendererDirectory)
    const path = resolve(root, `.${decodeURIComponent(url.pathname)}`)
    const file = await realpath(path)
    const fromRoot = relative(root, file)
    if (!fromRoot || fromRoot === '..' || fromRoot.startsWith(`..${sep}`) || isAbsolute(fromRoot)) {
      return new Response(null, { status: 403 })
    }
    return await net.fetch(pathToFileURL(file).href)
  } catch {
    return new Response(null, { status: 404 })
  }
}

const nativeColors = {
  light: { background: 'rgba(255, 255, 255, 1)', foreground: 'rgba(10, 10, 10, 1)' },
  dark: { background: 'rgba(10, 10, 10, 1)', foreground: 'rgba(250, 250, 250, 1)' }
}
const themeState = (): ThemeState => ({
  source: nativeTheme.themeSource,
  dark: nativeTheme.shouldUseDarkColors
})
const isTheme = (value: unknown): value is Theme =>
  value === 'light' || value === 'dark' || value === 'system'

function themePath(): string {
  return join(app.getPath('userData'), 'appearance.json')
}

function openExternal(raw: string): void {
  try {
    const url = new URL(raw)
    if (!['https:', 'http:'].includes(url.protocol) || url.username || url.password) return
    void shell.openExternal(url.href).catch(() => {
      // A rejected OS browser launch must never become an unhandled rejection.
    })
  } catch {
    // Reject malformed, file:, javascript:, and other non-web URLs.
  }
}

function updateAppearance(window: BrowserWindow): void {
  const colors = nativeColors[nativeTheme.shouldUseDarkColors ? 'dark' : 'light']
  window.setBackgroundColor(colors.background)
  if (process.platform !== 'darwin') {
    window.setTitleBarOverlay({
      color: colors.background,
      symbolColor: colors.foreground,
      height: 48
    })
  }
  window.webContents.send('theme:changed', themeState())
}

function createWindow(): BrowserWindow {
  const colors = nativeColors[nativeTheme.shouldUseDarkColors ? 'dark' : 'light']
  const window = new BrowserWindow({
    title: 'Phonivra',
    icon: appIcon,
    width: 1200,
    height: 800,
    minWidth: 960,
    minHeight: 640,
    show: false,
    backgroundColor: colors.background,
    autoHideMenuBar: true,
    titleBarStyle: 'hidden',
    ...(process.platform === 'darwin'
      ? { trafficLightPosition: { x: 16, y: 16 } }
      : {
          titleBarOverlay: { color: colors.background, symbolColor: colors.foreground, height: 48 }
        }),
    webPreferences: {
      partition: rendererPartition,
      preload: join(here, '../preload/index.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      webSecurity: true,
      webviewTag: false
    }
  })

  studioWindows.add(window)
  window.once('closed', () => studioWindows.delete(window))
  window.once('ready-to-show', () => window.show())
  window.webContents.on('preload-error', (_event, preloadPath, error) => {
    console.error('Unable to load Phonivra preload script:', preloadPath, error)
  })
  window.webContents.on('did-fail-load', (_event, code, description) => {
    console.error('Unable to load Phonivra interface:', code, description)
  })
  window.webContents.setWindowOpenHandler(({ url }) => {
    openExternal(url)
    return { action: 'deny' }
  })
  window.webContents.on('will-navigate', (event, url) => {
    event.preventDefault()
    openExternal(url)
  })
  window.webContents.on('will-redirect', (event) => event.preventDefault())
  window.webContents.on('will-attach-webview', (event) => event.preventDefault())
  window.webContents.session.setPermissionRequestHandler((_contents, _permission, callback) =>
    callback(false)
  )
  window.webContents.session.setPermissionCheckHandler(() => false)
  window.webContents.on('did-finish-load', () => {
    void window.webContents.setVisualZoomLevelLimits(1, 1).catch((error: unknown) => {
      console.error('Could not lock renderer zoom', error)
    })
  })
  window.webContents.on('before-input-event', (event, input) => {
    if ((input.control || input.meta) && ['+', '=', '-', '0'].includes(input.key))
      event.preventDefault()
  })

  if (devURL) {
    const url = new URL(devURL)
    if (url.origin !== devRendererOrigin || url.username || url.password) {
      throw new Error('Unexpected renderer development URL')
    }
    void window.loadURL(url.href)
  } else {
    void window.loadURL(`${appOrigin}/index.html`)
  }
  return window
}

void app.whenReady().then(() => {
  if (!primaryInstance) return
  try {
    const saved: unknown = JSON.parse(readFileSync(themePath(), 'utf8'))
    if (isTheme(saved)) nativeTheme.themeSource = saved
  } catch {
    nativeTheme.themeSource = 'dark'
  }

  function assertTrusted(event: Electron.IpcMainInvokeEvent): void {
    const window = BrowserWindow.fromWebContents(event.sender)
    const frame = event.senderFrame
    if (
      !window ||
      !studioWindows.has(window) ||
      !frame ||
      frame !== event.sender.mainFrame ||
      frame.origin !== (devURL ? devRendererOrigin : appOrigin)
    )
      throw new Error('Untrusted IPC sender')
  }

  const studio = new LocalStudio((state) => {
    for (const window of studioWindows) {
      if (
        !window.isDestroyed() &&
        window.webContents.mainFrame.origin === (devURL ? devRendererOrigin : appOrigin)
      ) {
        window.webContents.send('studio:changed', state)
      }
    }
  })
  let quitting = false
  let engineStopped = false
  app.on('before-quit', (event) => {
    if (engineStopped) return
    event.preventDefault()
    if (quitting) return
    quitting = true
    void studio.dispose().finally(() => {
      engineStopped = true
      app.quit()
    })
  })
  session
    .fromPartition(rendererPartition)
    .protocol.handle(new URL(appOrigin).protocol.slice(0, -1), (request) => {
      const url = new URL(request.url)
      const origin = `${url.protocol}//${url.host}`
      if (url.username || url.password) return new Response(null, { status: 403 })
      if (origin === appOrigin) return serveRenderer(request, url)
      if (origin === mediaOrigin) return studio.media(request)
      return new Response(null, { status: 404 })
    })
  ipcMain.handle('studio:snapshot', (event) => {
    assertTrusted(event)
    return studio.snapshot()
  })
  ipcMain.handle('studio:dispatch', (event, command: unknown) => {
    assertTrusted(event)
    if (!validateCommand(command)) throw new Error('Invalid studio request')
    return studio.dispatch(command)
  })
  ipcMain.handle('studio:waveform', (event, id: unknown) => {
    assertTrusted(event)
    if (typeof id !== 'string' || !id || id.length > 256)
      throw new Error('Invalid audio identifier')
    return studio.waveform(id)
  })
  ipcMain.handle('studio:playback', (event, value: unknown) => {
    assertTrusted(event)
    if (!value || typeof value !== 'object') throw new Error('Invalid playback state')
    const playback = value as { playing: unknown; position: unknown; outputId: unknown }
    if (
      typeof playback.playing !== 'boolean' ||
      typeof playback.position !== 'number' ||
      !Number.isFinite(playback.position) ||
      playback.position < 0 ||
      !(
        playback.outputId === null ||
        (typeof playback.outputId === 'string' && playback.outputId.length <= 256)
      )
    )
      throw new Error('Invalid playback state')
    studio.reportPlayback({
      playing: playback.playing,
      position: playback.position,
      outputId: playback.outputId
    })
  })

  ipcMain.handle('theme:get', (event) => {
    assertTrusted(event)
    return themeState()
  })
  ipcMain.handle('theme:set', (event, theme: unknown) => {
    assertTrusted(event)
    if (!isTheme(theme)) throw new Error('Invalid theme')
    mkdirSync(app.getPath('userData'), { recursive: true })
    writeFileSync(themePath(), JSON.stringify(theme), { mode: 0o600 })
    nativeTheme.themeSource = theme
    for (const window of BrowserWindow.getAllWindows()) updateAppearance(window)
    return themeState()
  })
  ipcMain.handle('window:control', (event, action: WindowAction) => {
    assertTrusted(event)
    if (!['minimize', 'maximize', 'close'].includes(action))
      throw new Error('Invalid window action')
    // Intentionally a stub; native overlay controls already handle the real window.
  })
  nativeTheme.on('updated', () => {
    for (const window of BrowserWindow.getAllWindows()) updateAppearance(window)
  })

  createWindow()
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
