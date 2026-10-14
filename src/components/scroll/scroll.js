import { useImperativeHandle, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { Range } from './range.js'
import { Runway } from './runway.js'
import { ScrollContainer } from './container.js'
import { getExpandedRows, getExpandedRowsAbove } from './expansion.js'
import { Viewport } from './viewport.js'
import { useEvent } from '../../hooks/use-event.js'
import { restrict } from '../../common/util.js'
import { indexOf } from '../../common/sequence.js'


const getLayout = ({
  items,
  itemHeight,
  itemWidth,
  height,
  width,
  expandedItems = {},
  expansionPadding,
  overscan
}) => {
  let columns = Math.floor(width / itemWidth) || 1
  let isGrid = itemWidth > 0

  let expandedRows = getExpandedRows(
    columns,
    items,
    expandedItems,
    isGrid)

  let rows = Math.ceil(items.length / columns) + expandedRows.length
  let visibleRows = Math.ceil(height / itemHeight)
  let visibleItems = visibleRows * columns
  let overscanRows = Math.max(2, Math.ceil(visibleRows * overscan))
  let rowsPerPage = visibleRows + overscanRows

  // The rendered rows move in steps of a third of the overscan.
  // The rest of the overscan is split evenly above and below
  // the visible rows: that much stays rendered ahead in both directions.
  let step = Math.max(1, Math.floor(overscanRows / 3))
  let pageOffset = Math.floor((overscanRows - step) / 2) * itemHeight

  let runway = rows * itemHeight

  if (expandedRows.length > 0)
    runway += expansionPadding

  let maxOffset = runway - (rowsPerPage * itemHeight)
  maxOffset = Math.max(maxOffset - (maxOffset % itemHeight), 0)

  return {
    columns,
    expandedRows,
    isGrid,
    rows,
    rowsPerPage,
    runway,
    pageOffset,
    maxOffset,
    step,
    visibleItems
  }
}

// The viewport's offset and first row at the given scroll position.
const getPosition = (top, { itemHeight, expansionPadding }, {
  expandedRows,
  maxOffset,
  pageOffset
}) => {
  let offset = restrict(
    top - (top % itemHeight) - pageOffset,
    0,
    maxOffset)

  let row = Math.floor(offset / itemHeight)

  let { numRowsAbove, expRowPosition } =
    getExpandedRowsAbove(expandedRows, { position: row })

  if (expandedRows.length) {
    offset = (row - expRowPosition) * itemHeight

    if (numRowsAbove > 0 && expRowPosition === 0)
      offset += expansionPadding
  }

  return { offset, row, numRowsAbove }
}


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

  // Only grids depend on the width: lists don't render again
  // when resized horizontally.
  let [width, setWidth] = useState(0)

  // The scroll position, rounded down to full steps:
  // scrolling within a step does not render again.
  let [top, setTop] = useState(0)

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

  let { offset, row, numRowsAbove } =
    getPosition(top, { itemHeight, expansionPadding }, layout)

  let scroll = (top, left) => {
    container.current.scrollTo({ top, left })
  }

  let scrollIntoView = useEvent((id = cursor, { force } = {}) => {
    // Nothing to scroll into before we are measured.
    if (height === 0)
      return

    let index = indexOf(items, id)

    if (index < 0)
      return

    // The expansion cursor's row, if it is in the item's expansion.
    let expRowPosition = (id === cursor && expansionCursor != null) ?
      (expandedItems?.[id]?.indexOf(expansionCursor) ?? -1) + 1 :
      0

    let { columns, expandedRows, isGrid } = layout
    let current = container.current.scrollTop
    let row = Math.floor(index / columns)

    let { numRowsAbove } =
      getExpandedRowsAbove(expandedRows, { index: row })

    let target = (row + numRowsAbove + expRowPosition) * itemHeight

    if (isGrid && numRowsAbove > 0)
      target += expansionPadding

    let bottom = target + itemHeight
    let isBelow = bottom > current

    // Don't scroll if item already in viewport!
    if (!force && isBelow && bottom <= current + height)
      return

    if (isBelow)
      target += itemHeight - height

    scroll(target)
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
  }, [cursor, expansionCursor, itemHeight, isMeasured, scrollIntoView])

  let updateTop = useEvent(() => {
    let { scrollTop } = container.current
    let quantum = layout.step * itemHeight

    setTop(scrollTop - (scrollTop % quantum))
  })

  // Round again when the steps change.
  useLayoutEffect(() => {
    updateTop()
  }, [layout.step, itemHeight, updateTop])

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
    },
    scrollIntoView,
    scrollToEnd () {
      scroll(layout.maxOffset)
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

  let from = columns * Math.max(0, row - numRowsAbove)
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
