import { getExpandedRows, getExpandedRowsAbove } from './expansion.js'
import { indexOf } from '../../common/sequence.js'
import { restrict } from '../../common/util.js'

export const getLayout = ({
  items,
  itemHeight,
  itemWidth,
  height,
  width,
  expandedItems,
  expanded,
  expansionLength,
  expansionPadding = 0,
  overscan
}) => {
  let columns = Math.floor(width / itemWidth) || 1
  let isGrid = itemWidth > 0

  let expandedRows = isGrid ? [] : getExpandedRows(items, expandedItems)
  let gap = null

  // A grid may expand one item:
  // its expansion fills a gap below the item's row.
  if (isGrid && expanded != null) {
    let index = indexOf(items, expanded)

    if (index >= 0)
      gap = {
        index,
        row: Math.floor(index / columns),
        height: Math.ceil(expansionLength / columns) * itemHeight +
          expansionPadding
      }
  }

  let rows = Math.ceil(items.length / columns) + expandedRows.length
  let visibleRows = Math.ceil(height / itemHeight)
  let overscanRows = Math.max(2, Math.ceil(visibleRows * overscan))
  let rowsPerPage = visibleRows + overscanRows

  // The rendered rows move in steps of a third of the overscan.
  // The rest of the overscan is split evenly above and below
  // the visible rows: that much stays rendered ahead in both directions.
  let step = Math.max(1, Math.floor(overscanRows / 3))
  let pageOffset = Math.floor((overscanRows - step) / 2) * itemHeight

  let runway = rows * itemHeight + (gap?.height ?? 0)

  // The rendered rows start at the row of this offset at most.
  let maxOffset = Math.max(runway - (rowsPerPage * itemHeight), 0)

  return {
    columns,
    expandedRows,
    gap,
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
  let { columns, expandedRows, gap, itemHeight } = layout
  let row = Math.floor(index / columns)

  let { numRowsAbove } =
    getExpandedRowsAbove(expandedRows, { index: row })

  let offset = (row + numRowsAbove + expRowPosition) * itemHeight

  if (gap != null && row > gap.row)
    offset += gap.height

  return offset
}

// The first item of the row at the offset,
// and the row's position in the item's expansion.
// Offsets in the gap map to the expanded item's row.
export const getRowAt = (layout, offset) => {
  let { columns, expandedRows, gap, itemHeight } = layout

  if (gap != null && offset >= (gap.row + 1) * itemHeight)
    offset = Math.max(offset - gap.height, gap.row * itemHeight)

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
