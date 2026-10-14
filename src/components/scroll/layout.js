import { indexOf } from '../../common/sequence.js'
import { restrict } from '../../common/util.js'

export const getLayout = ({
  items,
  itemHeight,
  itemWidth,
  height,
  width,
  expanded,
  expansionLength,
  expansionPadding = 0,
  overscan
}) => {
  let columns = Math.floor(width / itemWidth) || 1
  let isGrid = itemWidth > 0

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

  let rows = Math.ceil(items.length / columns)
  let visibleRows = Math.ceil(height / itemHeight)
  let overscanRows = Math.max(2, Math.ceil(visibleRows * overscan))
  let rowsPerPage = visibleRows + overscanRows

  // The cursor's page size (PageUp/PageDown):
  // the items in the rows fully in view.
  let pageSize = columns * Math.max(Math.floor(height / itemHeight), 1)

  // The page is rendered for a scroll position: the overscan is
  // split evenly above and below the view at that position.
  // Scrolled less than the tolerance away, the page still covers
  // the view (it starts at a full row: one row less below).
  let pageOffset = Math.floor(overscanRows / 2) * itemHeight
  let tolerance = (Math.ceil(overscanRows / 2) - 1) * itemHeight

  let runway = rows * itemHeight + (gap?.height ?? 0)

  // The page starts at the row of this offset at most.
  let maxOffset = Math.max(runway - (rowsPerPage * itemHeight), 0)

  return {
    columns,
    gap,
    height,
    isGrid,
    itemHeight,
    length: items.length,
    maxOffset,
    pageOffset,
    pageSize,
    rowsPerPage,
    runway,
    tolerance
  }
}

// The offset of the item's row.
export const getOffset = (layout, index) => {
  let { columns, gap, itemHeight } = layout
  let row = Math.floor(index / columns)
  let offset = row * itemHeight

  if (gap != null && row > gap.row)
    offset += gap.height

  return offset
}

// The first item of the row at the offset.
// Offsets in the gap map to the expanded item's row.
export const getRowAt = (layout, offset) => {
  let { columns, gap, itemHeight } = layout

  if (gap != null && offset >= (gap.row + 1) * itemHeight)
    offset = Math.max(offset - gap.height, gap.row * itemHeight)

  return Math.floor(offset / itemHeight) * columns
}

// The rendered items at the scroll position (`from` inclusive,
// `to` exclusive), and the offset of the first one.
export const getPosition = (top, layout) => {
  let { columns, length, maxOffset, pageOffset, rowsPerPage } = layout
  let from = getRowAt(layout, restrict(top - pageOffset, 0, maxOffset))

  return {
    from,
    to: Math.min(from + columns * rowsPerPage, length),
    offset: getOffset(layout, from)
  }
}
