import { useRef } from 'react'
import ARGS from '../args.js'
import { useEventHandler } from './use-event-handler.js'

export function useArgs(name) {
  let ref = useRef(ARGS[name])

  useEventHandler(window, 'hashchange', () => {
    ref.current = ARGS[name]
  })

  return ref
}
