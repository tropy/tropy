import { ipcRenderer } from 'electron'
import { useEffect } from 'react'
import { useEvent } from './use-event.js'

export function useIpc () {
  return ipcRenderer
}

export function useIpcEvent (fn, params = []) {
  return useEvent((...args) => {
    ipcRenderer.send(...params, fn?.(...args))
  })
}

export function useIpcSend (params = []) {
  return useEvent((...args) => {
    ipcRenderer.send(...params, ...args)
  })
}

export function useIpcEventHandler (channel, callback) {
  let handler = useEvent(callback)

  useEffect(() => {
    if (channel) {
      ipcRenderer.on(channel, handler)

      return () => {
        ipcRenderer.off(channel, handler)
      }
    }
  }, [channel, handler])
}
