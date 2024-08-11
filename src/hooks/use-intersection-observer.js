import { useCallback, useRef } from 'react'

export function useIntersectionObserver({
  onChange,
  onEnter,
  onLeave
}) {
  let io = useRef(null)

  return useCallback((node) => {
    if (io.current) {
      io.current.disconnect()
    }

    if (node) {
      io.current = new IntersectionObserver(([entry]) => {
        let isVisible = (entry.intersectionRatio > 0)

        if (isVisible)
          onEnter?.()
        else
          onLeave?.()

        onChange?.(isVisible)

      }, { threshold: [0] })
      io.current.observe(node)

    } else {
      io.current = null
    }

    return node

  }, [onChange, onEnter, onLeave])
}
