import { useImperativeHandle, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { Page } from './page.js'
import { Runway } from './runway.js'
import { ScrollContainer } from './container.js'
import { Viewport } from './viewport.js'
import { getLayout, getPage } from './layout.js'
import { useAnchor, useLayoutChange } from './use-anchor.js'
import { useScrollIntoView } from './use-scroll-into-view.js'
import { useEvent } from '../../hooks/use-event.js'


export const Scroll = ({
  children,
  cursor,
  expansion,
  itemHeight,
  itemWidth,
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
    items: cursor.seq,
    itemHeight,
    itemWidth,
    height,
    width,
    expanded,
    expansionLength,
    expansionPadding,
    overscan
  }), [
    cursor.seq,
    itemHeight,
    itemWidth,
    height,
    width,
    expanded,
    expansionLength,
    expansionPadding,
    overscan
  ])

  let { from, to, offset } = getPage(pageScrollTop, layout)

  let anchor = useAnchor(cursor)

  // Renders a new page only when scrolled beyond the tolerance.
  let syncScrollTop = useEvent(() => {
    let { scrollTop } = container.current
    anchor.track(scrollTop)

    if (Math.abs(scrollTop - pageScrollTop) > layout.tolerance)
      setPageScrollTop(scrollTop)
  })

  // Programmatic scrolls update the rendered rows right away:
  // without waiting for the scroll event, they render before paint.
  let scroll = (top, left) => {
    container.current.scrollTo({ top, left })
    syncScrollTop()
  }

  // Zooming or resizing keeps the view stable; other layout changes
  // (measured or shown again, items changed) catch up with the
  // scroll position.
  useLayoutChange(layout, (prev) => {
    let top = anchor.restore(prev, layout)

    if (top == null)
      syncScrollTop()
    else
      scroll(top)
  })

  let { columns, isGrid, pageSize, runway } = layout

  // Reports the layout as options for cursors over the items.
  useLayoutEffect(() => {
    onLayoutChange?.({
      layout: isGrid ? 'grid' : 'list',
      columns,
      pageSize
    })
  }, [isGrid, columns, pageSize, onLayoutChange])

  let scrollIntoView = useScrollIntoView(layout, {
    container,
    cursor,
    scroll
  })

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
      tabIndex={cursor.seq.length === 0 ? null : tabIndex}>
      <Runway height={runway}>
        <Viewport
          tag={tag}
          columns={columns}
          offset={offset}>
          <Page
            columns={columns}
            items={cursor.seq}
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
