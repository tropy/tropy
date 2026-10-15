import { useCallback, useState, useRef } from 'react'
import { useEvent } from './use-event.js'
import { bounds, on, off } from '../dom.js'
import { contains } from '../common/math.js'

// Workaround, see #843
// When using overlay toolbars we need to work around an issue upstream
// where no mouse events are reported over app-draggable areas.
// Because of this titlebars will disappear if you move the cursor over them.
// As workaround, we detect mouse movement over the window but outside
// of the element containing the titlebar.

export function useMouseTracking () {
  'use no memo'

  let ref = useRef()
  let [isOver, setState] = useState(false)

  /* eslint-disable react-hooks/immutability */
  let handleMouseEnter = useEvent(() => {
    setState(true)
    off(ref.current, 'mousemove', handleMouseEnter)
    on(document, 'mouseover', handleMouseLeave)
  })
  /* eslint-enable react-hooks/immutability */

  let handleMouseLeave = useEvent((event) => {
    let isOutside = !contains(bounds(ref.current), {
      x: event.clientX,
      y: event.clientY
    })

    if (isOutside) {
      setState(false)
      off(document, 'mouseover', handleMouseLeave)
      on(ref.current, 'mousemove', handleMouseEnter)
    }
  })

  let setRef = useCallback((node) => {
    if (ref.current != null) {
      off(ref.current, 'mousemove', handleMouseEnter)
      off(document, 'mouseover', handleMouseLeave)
      setState(false)
    }

    if (node != null) {
      on(node, 'mousemove', handleMouseEnter)
    }

    ref.current = node
    return node

  }, [handleMouseEnter, handleMouseLeave])

  return [isOver, setRef]
}
