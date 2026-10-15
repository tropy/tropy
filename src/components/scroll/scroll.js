import { useImperativeHandle, useLayoutEffect, useRef } from 'react'
import { flushSync } from 'react-dom'
import { Page } from './page.js'
import { Runway } from './runway.js'
import { ScrollContainer } from './container.js'
import { Viewport } from './viewport.js'
import { getAnchoredScrollTop, getPage } from './layout.js'
import { useLayout, useLayoutChange } from './use-layout.js'
import { useScrollIntoView } from './use-scroll-into-view.js'
import { useScrollTop } from './use-scroll-top.js'


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

  let position = useScrollTop(container, layout)
  let { from, to, offset } = getPage(position.pageScrollTop, layout)

  // Zooming or resizing keeps the view stable; other layout changes
  // (measured or shown again, items changed) catch up with the
  // scroll position.
  useLayoutChange(layout, (prev) => {
    if (prev.height === 0)
      return position.sync()

    let scrollTop = position.scrollTop()
    let top = getAnchoredScrollTop(prev, layout, cursor.index, scrollTop)

    if (top != null)
      return position.scroll(top)

    // The tracked position holds, unless the browser clamped it
    // to a shorter runway: only then read the container's.
    let isClamped = scrollTop > Math.max(0, layout.runway - layout.height)
    position.sync(isClamped ? undefined : scrollTop)
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

  let scrollIntoView = useScrollIntoView(layout, { cursor, position })

  useImperativeHandle(ref, () => ({
    focus () {
      container.current.focus()
    },
    scrollBy (top, left) {
      container.current.scrollBy({ top, left })
      position.sync()
    },
    scrollIntoView
  }), [position, scrollIntoView])

  let handleScroll = () => {
    flushSync(position.sync)
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
