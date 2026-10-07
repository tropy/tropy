import { useEffect, useRef } from 'react'
import { useEvent } from './use-event.js'

export function useSingleClick (handler, { delay = 350 } = {}) {
  let timeout = useRef(null)

  let cancel = useEvent(() => {
    clearTimeout(timeout.current)
    timeout.current = null
  })

  let handleClick = useEvent((event) => {
    cancel()

    if (event.detail === 1) {
      timeout.current = setTimeout(() => {
        timeout.current = null
        handler(event)
      }, delay)
    }
  })

  useEffect(() => cancel, [cancel])

  return {
    onClick: handleClick,
    onMouseDown: cancel
  }
}
