import { useLayoutEffect, useRef } from 'react'
import { getOffset, getRowAt } from './layout.js'
import { indexOf } from '../../common/sequence.js'


const useLayoutChange = (layout, onChange) => {
  let committed = useRef()

  useLayoutEffect(() => {
    let prev = committed.current
    committed.current = layout

    if (prev != null && prev !== layout && layout.height > 0)
      onChange(prev)
  })
}


// Keeps the view stable when the rows change (zoom, resize):
// the cursor's row, if it was in view, or else the top row,
// stays at the same relative position in the view.
// Other layout changes (measured or shown again, items changed)
// call `onChange`. Returns the function to track scroll positions.
export const useAnchor = (layout, {
  cursor,
  items,
  onChange,
  scroll
}) => {
  // The browser clamps the scroll position before we get to
  // anchor (when the runway got shorter): we anchor from the last
  // position read instead.
  let lastScrollTop = useRef(0)

  let anchor = (prev) => {
    let scrollTop = lastScrollTop.current
    let index = indexOf(items, cursor)
    let offset = getOffset(prev, index)

    if (index < 0 ||
      offset < scrollTop ||
      offset + prev.itemHeight > scrollTop + prev.height) {
      index = getRowAt(prev, scrollTop)
      offset = getOffset(prev, index)
    }

    let center = (offset + prev.itemHeight / 2 - scrollTop) / prev.height

    scroll(getOffset(layout, index) +
      layout.itemHeight / 2 - center * layout.height)
  }

  useLayoutChange(layout, (prev) => {
    let hasNewRows = prev.columns !== layout.columns ||
      prev.itemHeight !== layout.itemHeight

    if (prev.height > 0 && hasNewRows)
      anchor(prev)
    else
      onChange()
  })

  return (scrollTop) => {
    lastScrollTop.current = scrollTop
  }
}
