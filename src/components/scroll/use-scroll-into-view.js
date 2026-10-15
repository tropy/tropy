import { useLayoutEffect } from 'react'
import { getScrollTo } from './layout.js'
import { useEvent } from '../../hooks/use-event.js'

// useScrollIntoView for virtualized nodes
// Keeps the cursor in view after rendering,
// and returns event handler.

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

  useLayoutEffect(() => {
    scrollIntoView()
  }, [cursor.id, isMeasured, scrollIntoView])

  return scrollIntoView
}
