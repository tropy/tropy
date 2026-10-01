import { useEffect } from 'react'

export function useScrollIntoView (ref, {
  when = false,
  center = true
}) {
  useEffect(() => {
    if (when)
      ref.current?.scrollIntoViewIfNeeded(center)
  }, [ref, when, center])
}
