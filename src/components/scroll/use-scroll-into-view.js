import { useLayoutEffect } from 'react'
import { getScrollTo } from './layout.js'
import { useEvent } from '../../hooks/use-event.js'

// useScrollIntoView for virtualized nodes
// Keeps the cursor in view after rendering,
// and returns event handler.
// A new sequence keeps the cursor in view,
// or starts at the top if the cursor is not in it.

export const useScrollIntoView = (layout, {
  container,
  cursor,
  scroll
}) => {
  let scrollIntoView = useEvent((element) => {
    // Nothing to scroll into before we are measured.
    if (layout.height === 0)
      return

    let { index } = (element == null) ? cursor : cursor.to(element)

    if (index < 0)
      return

    let top = getScrollTo(layout, index, container.current.scrollTop)

    if (top != null)
      scroll(top)
  })

  let isMeasured = layout.height > 0

  let handleSequenceChange = useEvent(() => {
    if (!isMeasured)
      return

    if (cursor.index < 0)
      scroll(0)
    else
      scrollIntoView()
  })

  useLayoutEffect(() => {
    scrollIntoView()
  }, [cursor.id, isMeasured, scrollIntoView])

  useLayoutEffect(() => {
    handleSequenceChange()
  }, [cursor.seq, handleSequenceChange])

  return scrollIntoView
}
