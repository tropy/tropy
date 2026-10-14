import { useImperativeHandle, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { Range } from './range.js'
import { Runway } from './runway.js'
import { ScrollContainer } from './container.js'
import { Viewport } from './viewport.js'
import { getLayout, getOffset, getPosition, getRowAt } from './layout.js'
import { useEvent } from '../../hooks/use-event.js'
import { indexOf } from '../../common/sequence.js'


export const Scroll = ({
  children,
  cursor,
  expandedItems,
  expansionCursor,
  expansionPadding = 0,
  itemHeight,
  itemWidth,
  items = [],
  onClick,
  onKeyDown,
  onLayoutChange,
  onTabFocus,
  overscan = 1.25,
  ref,
  renderExpansionRow,
  tabIndex,
  tag
}) => {
  let container = useRef()
  let frame = useRef()

  let [height, setHeight] = useState(0)

  // Only grids depend on the width:
  // lists don't render again when resized horizontally.
  let [width, setWidth] = useState(0)

  // The scroll position (as full row-steps).
  let [top, setTop] = useState(0)
  let exactTop = useRef(0)

  let layout = useMemo(() => getLayout({
    items,
    itemHeight,
    itemWidth,
    height,
    width,
    expandedItems,
    expansionPadding,
    overscan
  }), [
    items,
    itemHeight,
    itemWidth,
    height,
    width,
    expandedItems,
    expansionPadding,
    overscan
  ])

  let { from, offset } = getPosition(top, layout)

  // The item's index and, for the cursor,
  // the expansion cursor's row in the item's expansion.
  let locate = (id) => [
    indexOf(items, id),
    (id === cursor && expansionCursor != null) ?
      (expandedItems?.[id]?.indexOf(expansionCursor) ?? -1) + 1 :
      0
  ]

  // Programmatic scrolls update the rendered rows right away:
  // without waiting for the scroll event, they render before paint.
  let scroll = (top, left) => {
    container.current.scrollTo({ top, left })
    updateTop()
  }

  let updateTop = useEvent(() => {
    // Hidden: keep the position for when we are shown again.
    if (height === 0)
      return

    let { scrollTop } = container.current
    let quantum = layout.step * itemHeight

    exactTop.current = scrollTop
    setTop(scrollTop - (scrollTop % quantum))
  })

  let scrollIntoView = useEvent((id = cursor, { force } = {}) => {
    // Nothing to scroll into before we are measured.
    if (height === 0)
      return

    let [index, expRowPosition] = locate(id)

    if (index < 0)
      return

    let current = container.current.scrollTop
    let target = getOffset(layout, index, expRowPosition)
    let bottom = target + itemHeight
    let isBelow = bottom > current

    // Don't scroll if item already in viewport!
    if (!force && isBelow && bottom <= current + height)
      return

    if (isBelow)
      target += itemHeight - height

    scroll(target)
  })

  // Keeps the view stable when the rows change (zoom, resize):
  // the cursor's row, if it was visible, or else the top row,
  // stays at the same relative position in the viewport.
  let anchor = (prev) => {
    let top = exactTop.current
    let [index, expRowPosition] = locate(cursor)
    let offset = getOffset(prev, index, expRowPosition)

    if (index < 0 ||
      offset < top ||
      offset + prev.itemHeight > top + prev.height) {
      [index, expRowPosition] = getRowAt(prev, top)
      offset = getOffset(prev, index, expRowPosition)
    }

    let center = (offset + prev.itemHeight / 2 - top) / prev.height

    scroll(getOffset(layout, index, expRowPosition) +
      layout.itemHeight / 2 - center * layout.height)
  }

  // Compares each measured layout with the previous one.
  // Hidden or collapsed in between, the browser may have reset
  // the scroll position: we restore it when shown again.
  let committed = useRef()
  let wasHidden = useRef(false)

  useLayoutEffect(() => {
    if (layout.height === 0) {
      wasHidden.current = committed.current != null
      return
    }

    let prev = committed.current
    committed.current = layout

    if (prev == null || prev === layout)
      return

    if (wasHidden.current ||
      prev.columns !== layout.columns ||
      prev.itemHeight !== layout.itemHeight) {
      wasHidden.current = false
      anchor(prev)
    } else if (prev.step !== layout.step) {
      updateTop()
    }
  })

  let { columns, isGrid, rowsPerPage, runway } = layout
  let isMeasured = height > 0

  // The page size in items: fully visible rows times columns.
  let pageSize = columns * Math.max(Math.floor(height / itemHeight), 1)

  // Reports the layout as options for cursors over the items.
  useLayoutEffect(() => {
    onLayoutChange?.({
      layout: isGrid ? 'grid' : 'list',
      columns,
      pageSize
    })
  }, [isGrid, columns, pageSize, onLayoutChange])

  useLayoutEffect(() => {
    scrollIntoView()
  }, [cursor, expansionCursor, isMeasured, scrollIntoView])

  useLayoutEffect(() => () => {
    cancelAnimationFrame(frame.current)
    frame.current = null
  }, [])

  useImperativeHandle(ref, () => ({
    focus () {
      container.current.focus()
    },
    scroll,
    scrollBy (top, left) {
      container.current.scrollBy({ top, left })
      updateTop()
    },
    scrollIntoView,
    scrollToEnd () {
      scroll(layout.runway)
    }
  }))

  let handleResize = (size) => {
    setHeight(size.height)
    setWidth(itemWidth > 0 ? size.width : 0)
  }

  let handleScroll = () => {
    frame.current ??= requestAnimationFrame(() => {
      frame.current = null
      updateTop()
    })
  }

  let handleTabFocus = (event) => {
    // Callback first so it may select before scrolling!
    onTabFocus?.(event)
    scrollIntoView()
  }

  let to = Math.min(from + (columns * rowsPerPage), items.length)

  return (
    <ScrollContainer
      ref={container}
      onClick={onClick}
      onKeyDown={onKeyDown}
      onResize={handleResize}
      onScroll={handleScroll}
      onTabFocus={handleTabFocus}
      tabIndex={items.length === 0 ? null : tabIndex}>
      <Runway height={runway}>
        <Viewport
          tag={tag}
          columns={columns}
          offset={offset}>
          <Range
            columns={columns}
            items={items}
            from={from}
            to={to}
            expandedItems={expandedItems}
            renderExpansionRow={renderExpansionRow}
            renderItem={children}/>
        </Viewport>
      </Runway>
    </ScrollContainer>
  )
}
