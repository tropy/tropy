import { useCallback, useRef } from 'react'

export function useResizeObserver(onResize) {
  let ro = useRef(null)
  let size = useRef()

  return useCallback((node) => {
    if (ro.current) {
      ro.current.disconnect()
    }

    if (node) {
      ro.current = new ResizeObserver(([entry]) => {
        let { width, height } = entry.contentRect

        if (
          width !== size.current?.width ||
          height !== size.current?.height
        ) {
          size.current = { width, height }
          onResize(size.current)
        }
      })
      ro.current.observe(node)

    } else {
      ro.current = null
    }

    return node

  }, [onResize])
}
