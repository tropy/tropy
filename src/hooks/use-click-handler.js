import { useRef } from 'react'
import { useEvent } from './use-event.js'

export function useClickHandler({
  onClick,
  onSingleClick,
  onDoubleClick
}, delay = 350) {

  let timeout = useRef(null)

  return useEvent((event) => {

    // Handle only clicks with the left/primary button!
    if (event.button !== 0)
      return

    if (!timeout.current) {
      if (!onClick?.(event)) {
        timeout.current = setTimeout(() => {
          onSingleClick?.(event)
          timeout.current = null
        }, delay)
      }

    } else {
      onDoubleClick?.(event)
      clearTimeout(timeout.current)
      timeout.current = null
    }
  })
}
