import { useImperativeHandle, useLayoutEffect, useRef, useState } from 'react'
import { flushSync } from 'react-dom'
import { Page } from './page.js'
import { Runway } from './runway.js'
import { ScrollContainer } from './container.js'
import { Viewport } from './viewport.js'
import { getPage } from './layout.js'
import { useAnchor, useLayoutChange } from './use-anchor.js'
import { useLayout } from './use-layout.js'
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
  renderExpansion,
  tabIndex,
  tag
}) => {
  let container = useRef()

  let [layout, handleResize] = useLayout(cursor.seq, {
    expansion,
    itemHeight,
    itemWidth,
    overscan
  })

  // The scroll position the page is rendered for.
  let [pageScrollTop, setPageScrollTop] = useState(0)

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

  let handleScroll = () => {
    flushSync(syncScrollTop)
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
      onScroll={handleScroll}
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
            renderExpansion={renderExpansion}
            gap={layout.gap}
            renderItem={children}/>
        </Viewport>
      </Runway>
    </ScrollContainer>
  )
}
