import { useEffect } from 'react'
import { useWindow } from './use-window.js'

// Resizes the window to the given dimensions while the component is mounted.
export function useWindowSize(width, height) {
  let win = useWindow()

  useEffect(() => {
    let original = win.getBounds()
    win.setResizable(false)

    return () => {
      win.resize(original.width, original.height, true)
      win.setResizable(true)
    }
  }, [win])

  useEffect(() => {
    win.resize(width, height, true)
  }, [win, width, height])
}
