import { useRef, useState } from 'react'
import { useEvent } from '../../hooks/use-event.js'

// Tracks the scroll position on scroll events
// and after programmatic scrolls.
//
// NB: Reading the container's position right after a commit
// forces a style and layout recalculation:
// so try to use this one instead!

export const useScrollTop = (container, layout) => {
  let tracked = useRef(0)
  let [pageScrollTop, setPageScrollTop] = useState(0)

  // Without a position, reads the container's.
  let sync = useEvent((position) => {
    let scrollTop = position ?? container.current.scrollTop
    tracked.current = scrollTop

    if (Math.abs(scrollTop - pageScrollTop) > layout.tolerance)
      setPageScrollTop(scrollTop)
  })

  // Programmatic scrolls update the rendered rows right away:
  // without waiting for the scroll event, they render before paint.
  let scroll = (top, left) => {
    container.current.scrollTo({ top, left })
    sync()
  }

  return {
    pageScrollTop,
    scroll,
    scrollTop: () => tracked.current,
    sync
  }
}
