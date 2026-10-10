import { useEffect } from 'react'

export function useScrollIntoView (ref, { when = false }) {
  useEffect(() => {
    // Subtle: scroll only the nearest container! Otherwise, elements
    // in the hidden item view can scroll it into view in project mode.
    if (when)
      ref.current?.scrollIntoView({ block: 'nearest', container: 'nearest' })
  }, [ref, when])
}
