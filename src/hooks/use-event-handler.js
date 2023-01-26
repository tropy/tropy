import { useEffect } from 'react'
import { useEvent } from './use-event.js'
import { on, off } from '../common/util.js'


export function useEventHandler(
  target,
  name,
  callback,
  passive = true,
  capture = false) {

  let handler = useEvent(callback)

  useEffect(() => {
    if (name) {
      on(target, name, handler, { capture, passive })

      return () => {
        off(target, name, handler, { capture, passive })
      }
    }
  }, [target, name, handler, passive, capture])
}
