import { useLayoutEffect, useRef } from 'react'
import { useEvent } from './use-event.js'

// Observes the node of the given stable (!) ref,
// reporting changes of its content box size.
//
// Subtle: because we stabilize the callback,
// we create the observer exactly once, when we mount;
// and we create none at all if there is no callback to report to.
//
export function useResizeObserver (nodeRef, onResize) {
  let size = useRef()
  let handler = useEvent(onResize)
  let isEnabled = onResize != null

  useLayoutEffect(() => {
    if (!isEnabled || nodeRef.current == null)
      return

    let ro = new ResizeObserver(([entry]) => {
      let { width, height } = entry.contentRect

      if (width !== size.current?.width ||
        height !== size.current?.height) {
        size.current = { width, height }
        handler(size.current)
      }
    })

    ro.observe(nodeRef.current)

    return () => {
      ro.disconnect()
    }
  }, [nodeRef, handler, isEnabled])
}
