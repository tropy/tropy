import { useEffect } from 'react'
import { useWindow } from './use-window.js'

// Resizes the window to the given dimensions while the component is mounted.
export function useWindowSize(width, height, delay = 0) {
  let win = useWindow()

  useEffect(() => {
    win.setFixedSize(true)

    return () => {
      setTimeout(() => { win?.setFixedSize(false) }, delay)
    }

  }, [win, delay])

  useEffect(() => {
    if (width && height) {
      win.resize(width, height)
    }
  }, [win, width, height])
}
