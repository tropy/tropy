import { useContext, useState } from 'react'
import { WindowContext } from '../components/window.js'
import { useEventHandler } from './use-event-handler.js'
import { clone } from '../args.js'

export function useWindow() {
  return useContext(WindowContext)
}

export function useWindowArgs() {
  let win = useWindow()
  let [args, setArgs] = useState(clone)

  useEventHandler(win, 'settings.update', () => {
    setArgs(clone())
  })

  return args
}
