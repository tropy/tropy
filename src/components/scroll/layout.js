import { getExpandedRows, getExpandedRowsAbove } from './expansion.js'
import { restrict } from '../../common/util.js'

export const getLayout = ({
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
    expansionPadding,
    height,
    isGrid,
    itemHeight,
    maxOffset,
    pageOffset,
    rowsPerPage,
    runway,
    step
  }
}

// The offset of the item's row, or of a row in its expansion.
export const getOffset = (layout, index, expRowPosition = 0) => {
  let { columns, expandedRows, expansionPadding, isGrid, itemHeight } = layout
  let row = Math.floor(index / columns)

  let { numRowsAbove } =
    getExpandedRowsAbove(expandedRows, { index: row })

  let offset = (row + numRowsAbove + expRowPosition) * itemHeight

  if (isGrid && numRowsAbove > 0)
    offset += expansionPadding

  return offset
}

// The first item of the row at the offset,
// and the row's position in the item's expansion.
export const getRowAt = (layout, offset) => {
  let { columns, expandedRows, itemHeight } = layout
  let row = Math.floor(offset / itemHeight)

  let { numRowsAbove, expRowPosition } =
    getExpandedRowsAbove(expandedRows, { position: row })

  return [(row - numRowsAbove) * columns, expRowPosition]
}

// The first rendered item at the scroll position, and its offset.
// The rendered rows start at a full item row (with its expansion).
export const getPosition = (top, layout) => {
  let { maxOffset, pageOffset } = layout
  let [from] = getRowAt(layout, restrict(top - pageOffset, 0, maxOffset))

  return { from, offset: getOffset(layout, from) }
}
