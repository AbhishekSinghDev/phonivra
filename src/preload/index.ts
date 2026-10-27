import { contextBridge, ipcRenderer } from 'electron'
import type { StudioSnapshot } from '../shared/studio'
import type { DesktopAPI, ThemeState } from '../shared/api'

const api: DesktopAPI = {
  studio: {
    getSnapshot: () => ipcRenderer.invoke('studio:snapshot'),
    dispatch: (command) => ipcRenderer.invoke('studio:dispatch', command),
    onChange: (callback) => {
      const listener = (_event: Electron.IpcRendererEvent, state: StudioSnapshot): void =>
        callback(state)
      ipcRenderer.on('studio:changed', listener)
      return () => ipcRenderer.removeListener('studio:changed', listener)
    }
  },
  review: {
    selectScenario: (id) => ipcRenderer.invoke('review:scenario', id),
    advance: () => ipcRenderer.invoke('review:advance'),
    setPaused: (paused) => ipcRenderer.invoke('review:pause', paused),
    reset: () => ipcRenderer.invoke('review:scenario', 'ready')
  },
  platform:
    process.platform === 'darwin' ? 'darwin' : process.platform === 'win32' ? 'win32' : 'linux',
  window: { control: (action) => ipcRenderer.invoke('window:control', action) },
  theme: {
    get: () => ipcRenderer.invoke('theme:get'),
    set: (theme) => ipcRenderer.invoke('theme:set', theme),
    onChange: (callback) => {
      const listener = (_event: Electron.IpcRendererEvent, state: ThemeState): void =>
        callback(state)
      ipcRenderer.on('theme:changed', listener)
      return () => ipcRenderer.removeListener('theme:changed', listener)
    }
  }
}

contextBridge.exposeInMainWorld('api', api)
