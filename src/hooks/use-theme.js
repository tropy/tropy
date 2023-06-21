import { useState } from 'react'
import { useWindow } from './use-window.js'
import { useEventHandler } from './use-event-handler.js'

export function useTheme() {
  let win = useWindow()
  let [theme, setTheme] = useState(win.theme)
  let [scrollbars, setScrollbars] = useState(win.args.scrollbars)

  useEventHandler(win, 'settings.update', () => {
    setTheme(win.theme)
    setScrollbars(win.args.scrollbars)
  })

  return { theme, scrollbars }
}
