import { useImperativeHandle, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { Range } from './range.js'
import { Runway } from './runway.js'
import { ScrollContainer } from './container.js'
import { Viewport } from './viewport.js'
import { getLayout, getOffset, getPosition } from './layout.js'
import { useAnchor } from './use-anchor.js'
import { useEvent } from '../../hooks/use-event.js'
import { indexOf } from '../../common/sequence.js'


export const Scroll = ({
  children,
  cursor,
  expansion,
  itemHeight,
  itemWidth,
  items = [],
  onClick,
  onKeyDown,
  onLayoutChange,
  onTabFocus,
  overscan = 0.75,
  ref,
  tabIndex,
  tag
}) => {
  let container = useRef()

  let [height, setHeight] = useState(0)

  // Only grids depend on the width:
  // lists don't render again when resized horizontally.
  let [width, setWidth] = useState(0)

  // The scroll position the page is rendered for.
  let [pageScrollTop, setPageScrollTop] = useState(0)

  // A grid may expand one item: `{ id, length, padding, render }`.
  // Its expansion renders `length` items in the grid's columns.
  let {
    id: expanded,
    length: expansionLength,
    padding: expansionPadding
  } = expansion ?? {}

  let layout = useMemo(() => getLayout({
    items,
    itemHeight,
    itemWidth,
    height,
    width,
    expanded,
    expansionLength,
    expansionPadding,
    overscan
  }), [
    items,
    itemHeight,
    itemWidth,
    height,
    width,
    expanded,
    expansionLength,
    expansionPadding,
    overscan
  ])

  let { from, to, offset } = getPosition(pageScrollTop, layout)

  // Programmatic scrolls update the rendered rows right away:
  // without waiting for the scroll event, they render before paint.
  let scroll = (top, left) => {
    container.current.scrollTo({ top, left })
    syncScrollTop()
  }

  // Renders a new page only when scrolled beyond the tolerance.
  let syncScrollTop = useEvent(() => {
    let { scrollTop } = container.current
    track(scrollTop)

    if (Math.abs(scrollTop - pageScrollTop) > layout.tolerance)
      setPageScrollTop(scrollTop)
  })

  let scrollIntoView = useEvent((id = cursor) => {
    // Nothing to scroll into before we are measured.
    if (height === 0)
      return

    let index = indexOf(items, id)

    if (index < 0)
      return

    let { scrollTop } = container.current
    let target = getOffset(layout, index)
    let bottom = target + itemHeight
    let isBelow = bottom > scrollTop

    // Don't scroll if item already in view!
    if (isBelow && bottom <= scrollTop + height)
      return

    // Near the view (within its height): align to the nearest edge.
    // Far away: center the item, to show what is around it.
    let isNear = bottom > scrollTop - height &&
      target < scrollTop + 2 * height

    if (!isNear)
      scroll(target + (itemHeight - height) / 2)
    else if (isBelow)
      scroll(bottom - height)
    else
      scroll(target)
  })

  let track = useAnchor(layout, {
    cursor,
    items,
    onChange: syncScrollTop,
    scroll
  })

  let { columns, isGrid, pageSize, runway } = layout
  let isMeasured = height > 0

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
  }, [cursor, isMeasured, scrollIntoView])

  useImperativeHandle(ref, () => ({
    focus () {
      container.current.focus()
    },
    scrollBy (top, left) {
      container.current.scrollBy({ top, left })
      syncScrollTop()
    },
    scrollIntoView
  }), [syncScrollTop, scrollIntoView])

  let handleResize = (size) => {
    setHeight(size.height)
    setWidth(itemWidth > 0 ? size.width : 0)
  }

  let handleTabFocus = (event) => {
    // Callback first so it may select before scrolling!
    onTabFocus?.(event)
    scrollIntoView()
  }

  return (
    <ScrollContainer
      ref={container}
      onClick={onClick}
      onKeyDown={onKeyDown}
      onResize={handleResize}
      onScroll={syncScrollTop}
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
            renderExpansion={expansion?.render}
            gap={layout.gap}
            renderItem={children}/>
        </Viewport>
      </Runway>
    </ScrollContainer>
  )
}
