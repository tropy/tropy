import { useCallback } from 'react'
import { ipcRenderer } from 'electron'

export function useIpcSend(dependencies = []) {
  return useCallback((...args) => {
    ipcRenderer.send(...dependencies, ...args)
  }, dependencies) // eslint-disable-line react-hooks/exhaustive-deps
}
