import { useCallback } from 'react'
import { ipcRenderer } from 'electron'
import { useEvent } from './use-event.js'

export function useIpc() {
  return ipcRenderer
}

export function useIpcEvent(fn, params = []) {
  return useEvent((...args) => {
    ipcRenderer.send(...params, fn?.(...args))
  })
}

export function useIpcSend(dependencies = []) {
  return useCallback((...args) => {
    ipcRenderer.send(...dependencies, ...args)
  }, dependencies) // eslint-disable-line react-hooks/exhaustive-deps
}
