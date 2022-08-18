import { useEffect } from 'react'
import { useEvent } from './use-event.js'
import { on, off } from '../dom.js'

export function useEventHandler(target, name, callback, passive = true) {
  let handler = useEvent(callback)

  useEffect(() => {
    if (name) {
      on(target, name, handler, { passive })

      return () => {
        off(document, name, handler, { passive })
      }
    }
  }, [target, name, handler, passive])
}
