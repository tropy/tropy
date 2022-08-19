import { useState } from 'react'
import ARGS from '../args.js'
import { useEventHandler } from './use-event-handler.js'

export function useArgs(name) {
  let [arg, setArg] = useState(ARGS[name])

  useEventHandler(window, 'hashchange', () => {
    setArg(ARGS[name])
  })

  return arg
}
