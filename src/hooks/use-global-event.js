import { useEffect } from 'react'
import { useEvent } from './use-event.js'
import { on, off } from '../dom.js'


export function useGlobalEvent(name, callback) {
  let handler = useEvent(callback)

  useEffect(() => {
    on(document, `global:${name}`, handler, { passive: true })

    return () => {
      off(document, `global:${name}`, handler, { passive: true })
    }
  }, [name, handler])
}
