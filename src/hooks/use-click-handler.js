import { useRef } from 'react'
import { useEvent } from './use-event.js'

export function useClickHandler ({
  onClick,
  onSingleClick,
  onDoubleClick
}, delay = 350) {
  let timeout = useRef(null)
  let cancelled = useRef(false)

  return useEvent((event) => {
    // Handle only clicks with the left/primary button!
    if (event.button !== 0)
      return

    if (!timeout.current) {
      cancelled.current = !!onClick?.(event)

      timeout.current = setTimeout(() => {
        if (!cancelled.current)
          onSingleClick?.(event)
        timeout.current = null
      }, delay)

    } else {
      if (!cancelled.current)
        onDoubleClick?.(event)

      clearTimeout(timeout.current)
      timeout.current = null
    }
  })
}
