import { useLayoutEffect, useRef } from 'react'
import { useEvent } from './use-event.js'

// Observes the node of the given ref, reporting changes of its content
// box size. Subtle: because we stabilize the callback, we create the
// observer exactly once, when we mount; and we create none at all if
// there is no callback to report to.
export function useResizeObserver (ref, onResize) {
  let size = useRef()
  let handler = useEvent(onResize)
  let isEnabled = onResize != null

  useLayoutEffect(() => {
    if (!isEnabled || ref.current == null)
      return

    let ro = new ResizeObserver(([entry]) => {
      let { width, height } = entry.contentRect

      if (width !== size.current?.width ||
        height !== size.current?.height) {
        size.current = { width, height }
        handler(size.current)
      }
    })

    ro.observe(ref.current)

    return () => {
      ro.disconnect()
    }
  }, [ref, handler, isEnabled])
}
