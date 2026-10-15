import { useLayoutEffect } from 'react'
import { getScrollTo } from './layout.js'
import { useEvent } from '../../hooks/use-event.js'

// useScrollIntoView for virtualized nodes
// Keeps the cursor in view after rendering,
// and returns event handler.
// A new sequence keeps the cursor in view,
// or starts at the top if the cursor is not in it.

export const useScrollIntoView = (layout, { cursor, position }) => {
  let scrollIntoView = useEvent((element) => {
    // Nothing to scroll into before we are measured.
    if (layout.height === 0)
      return

    let { index } = (element == null)
      ? cursor
      : cursor.to(element)

    if (index < 0)
      return

    let top = getScrollTo(layout, index, position.scrollTop())

    if (top != null)
      position.scroll(top)
  })

  let isReady = layout.height > 0

  let handleSequenceChange = useEvent(() => {
    // Only if not at the top already: scrolling forces
    // a style and layout recalculation, even without moving.
    if (cursor.index >= 0)
      scrollIntoView()
    else if (position.scrollTop() > 0)
      position.scroll(0)
  })

  useLayoutEffect(() => {
    scrollIntoView()
  }, [cursor.id, isReady, scrollIntoView])

  useLayoutEffect(() => {
    handleSequenceChange()
  }, [cursor.seq, handleSequenceChange])

  return scrollIntoView
}
