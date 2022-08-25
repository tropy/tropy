import { useEffect, useRef } from 'react'
import { useWindow } from './use-window.js'

// Resizes the window to the given dimensions while the component is mounted.
export function useWindowSize(width, height) {
  let win = useWindow()
  let wasResized = useRef(false)

  useEffect(() => {
    win.setFixedSize(true)

    return () => {
      win.setFixedSize(false)
    }

  }, [win])

  useEffect(() => {
    if (width && height) {
      win.resize(width, height, wasResized.current)
      wasResized.current = true
    }
  }, [win, width, height])
}
