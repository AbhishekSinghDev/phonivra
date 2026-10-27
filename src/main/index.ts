import { MockStudio } from './mock-studio'
import { validateCommand } from '../shared/validation'
import { app, BrowserWindow, ipcMain, nativeTheme, shell } from 'electron'
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import type { Theme, ThemeState, WindowAction } from '../shared/api'

const here = dirname(fileURLToPath(import.meta.url))
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
      preload: join(here, '../preload/index.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      webSecurity: true,
      webviewTag: false
    }
  })

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

  const devURL = process.env.ELECTRON_RENDERER_URL
  if (!app.isPackaged && devURL) {
    const url = new URL(devURL)
    if (url.protocol !== 'http:' || url.hostname !== '127.0.0.1' || url.port !== '5173') {
      throw new Error('Unexpected renderer development URL')
    }
    void window.loadURL(url.href)
  } else {
    void window.loadFile(join(here, '../renderer/index.html'))
  }
  return window
}

void app.whenReady().then(() => {
  try {
    const saved: unknown = JSON.parse(readFileSync(themePath(), 'utf8'))
    if (isTheme(saved)) nativeTheme.themeSource = saved
  } catch {
    nativeTheme.themeSource = 'system'
  }

  function assertTrusted(event: Electron.IpcMainInvokeEvent): void {
    const window = BrowserWindow.fromWebContents(event.sender)
    if (!window || event.senderFrame !== event.sender.mainFrame)
      throw new Error('Untrusted IPC sender')
  }

  const studio = new MockStudio((state) => {
    for (const window of BrowserWindow.getAllWindows()) {
      if (!window.isDestroyed()) window.webContents.send('studio:changed', state)
    }
  })
  app.once('before-quit', () => studio.dispose())
  ipcMain.handle('studio:snapshot', (event) => {
    assertTrusted(event)
    return studio.snapshot()
  })
  ipcMain.handle('studio:dispatch', (event, command: unknown) => {
    assertTrusted(event)
    if (!validateCommand(command)) throw new Error('Invalid studio request')
    return studio.dispatch(command)
  })
  function assertReview(event: Electron.IpcMainInvokeEvent): void {
    assertTrusted(event)
    if (app.isPackaged || !process.env.ELECTRON_RENDERER_URL)
      throw new Error('Review tools are development-only')
  }
  ipcMain.handle('review:scenario', (event, id: unknown) => {
    assertReview(event)
    if (typeof id !== 'string') throw new Error('Invalid scenario')
    return studio.selectScenario(id)
  })
  ipcMain.handle('review:advance', (event) => {
    assertReview(event)
    return studio.advance()
  })
  ipcMain.handle('review:pause', (event, paused: unknown) => {
    assertReview(event)
    if (typeof paused !== 'boolean') throw new Error('Invalid pause state')
    return studio.setPaused(paused)
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
