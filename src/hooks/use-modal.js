import { useCallback, useSyncExternalStore } from 'react'
import { useWindow } from './use-window.js'

export function useModal () {
  let { dialog } = useWindow()

  let subscribe = useCallback((handleChange) => {
    dialog.on('change', handleChange)
    return () => { dialog.off('change', handleChange) }
  }, [dialog])

  return useSyncExternalStore(subscribe, () => dialog.current)
}
