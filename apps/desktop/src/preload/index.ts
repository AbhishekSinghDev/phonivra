import { contextBridge, ipcRenderer } from 'electron'
import type { StudioUpdate } from '../shared/studio'
import type { DesktopAPI, ThemeState } from '../shared/api'

const api: DesktopAPI = {
  studio: {
    getSnapshot: () => ipcRenderer.invoke('studio:snapshot'),
    dispatch: (command, outputsAfter) =>
      ipcRenderer.invoke('studio:dispatch', command, outputsAfter),
    waveform: (id) => ipcRenderer.invoke('studio:waveform', id),
    outputDetails: (id) => ipcRenderer.invoke('studio:output-details', id),
    onChange: (callback) => {
      const listener = (_event: Electron.IpcRendererEvent, state: StudioUpdate): void =>
        callback(state)
      ipcRenderer.on('studio:changed', listener)
      return () => ipcRenderer.removeListener('studio:changed', listener)
    }
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
