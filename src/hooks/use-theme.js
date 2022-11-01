import { useState } from 'react'
import { useWindow } from './use-window.js'
import { useEventHandler } from './use-event-handler.js'

export function useTheme() {
  let win = useWindow()
  let [theme, setTheme] = useState(win.theme)

  useEventHandler(win, 'settings.update', () => {
    setTheme(win.theme)
  })

  return theme
}
