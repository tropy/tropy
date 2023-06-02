import { useState } from 'react'
import { useWindow } from './use-window.js'
import { useEventHandler } from './use-event-handler.js'

export function useTheme() {
  let win = useWindow()
  let [theme, setTheme] = useState(win.theme)
  let [fontSize, setFontSize] = useState(win.state.fontSize)
  let [scrollbars, setScrollbars] = useState(win.state.scrollbars)

  useEventHandler(win, 'settings.update', () => {
    setTheme(win.theme)
    setFontSize(win.state.fontSize)
    setScrollbars(win.state.scrollbars)
  })

  return { theme, fontSize, scrollbars }
}
