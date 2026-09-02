import { useEffect } from 'react'
import { useEvent } from './use-event.js'
import { on, off } from '../common/util.js'

const resolve = (target) =>
  (target != null && 'current' in target) ? target.current : target


export function useEventHandler (
  target,
  name,
  callback,
  passive = false,
  capture = false) {

  let handler = useEvent(callback)

  useEffect(() => {
    let node = resolve(target)

    if (node && name) {
      on(node, name, handler, { capture, passive })

      return () => {
        off(node, name, handler, { capture, passive })
      }
    }
  }, [target, name, handler, passive, capture])
}
