import { useCallback, useRef } from 'react'

export function useResizeObserver(onResize) {
  let ro = useRef(null)

  return useCallback((node) => {
    if (ro.current) {
      ro.current.disconnect()
    }

    if (node) {
      ro.current = new ResizeObserver(([entry]) => {
        onResize(entry.contentRect)
      })
      ro.current.observe(node)

    } else {
      ro.current = null
    }

    return node

  }, [onResize])
}
