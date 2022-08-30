import { useEffect } from 'react'
import { useWindow } from './use-window.js'

// Resizes the window to the given dimensions while the component is mounted.
export function useWindowSize(width, height) {
  let win = useWindow()

  useEffect(() => {
    win.setFixedSize(true)

    return () => {
      win.setFixedSize(false)
    }

  }, [win])

  useEffect(() => {
    if (width && height) {
      win.resize(width, height)
    }
  }, [win, width, height])
}
