import { useEffect } from 'react'
import { useEvent } from './use-event.js'
import { on, off } from '../common/util.js'

export function useEventHandler (
  target,
  name,
  callback,
  passive = false,
  capture = false) {

  let handler = useEvent(callback)
  let isDisabled = target == null || !name || callback == null

  useEffect(() => {
    if (!isDisabled) {
      on(target, name, handler, { capture, passive })

      return () => {
        off(target, name, handler, { capture, passive })
      }
    }
  }, [target, name, handler, isDisabled, passive, capture])
}
