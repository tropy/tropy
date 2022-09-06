import { useEffect } from 'react'
import { useWindow } from './use-window.js'

// Resizes the window to the given dimensions while the component is mounted.
export function useWindowSize(width, height) {
  let win = useWindow()
  let delay = win.isResizeAnimated() ? 150 : 0

  useEffect(() => {
    win.setFixedSize(true)

    return () => {
      // Using a timeout because we want this to fire after unmount!
      setTimeout(() => { win?.setFixedSize(false) }, delay)
    }

  }, [win, delay])

  useEffect(() => {
    if (width && height) {
      win.resize(width, height)
    }
  }, [win, width, height])
}
