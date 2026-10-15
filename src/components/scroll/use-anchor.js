import { useLayoutEffect, useRef } from 'react'
import { getOffset, getRowAt } from './layout.js'


export const useLayoutChange = (layout, onChange) => {
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
// `track` each scroll position read; when the layout changes,
// `restore` returns the scroll position that keeps the view stable
// (nothing if the rows did not change).
export const useAnchor = (cursor) => {
  // The browser clamps the scroll position before we get to
  // anchor (when the runway got shorter): we anchor from the last
  // position read instead.
  let lastScrollTop = useRef(0)

  let track = (scrollTop) => {
    lastScrollTop.current = scrollTop
  }

  let restore = (prev, layout) => {
    let hasNewRows = prev.columns !== layout.columns ||
      prev.itemHeight !== layout.itemHeight

    if (prev.height === 0 || !hasNewRows)
      return

    let scrollTop = lastScrollTop.current
    let { index } = cursor
    let offset = getOffset(prev, index)

    if (index < 0 ||
      offset < scrollTop ||
      offset + prev.itemHeight > scrollTop + prev.height) {
      index = getRowAt(prev, scrollTop)
      offset = getOffset(prev, index)
    }

    let center = (offset + prev.itemHeight / 2 - scrollTop) / prev.height

    return getOffset(layout, index) +
      layout.itemHeight / 2 - center * layout.height
  }

  return { track, restore }
}
