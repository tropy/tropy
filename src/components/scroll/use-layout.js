import { useMemo, useState } from 'react'
import { getLayout } from './layout.js'

export const useLayout = (items, {
  expansion,
  itemHeight,
  itemWidth,
  overscan
}) => {
  let [height, setHeight] = useState(0)

  // Only grids depend on the width:
  // lists don't render again when resized horizontally.
  let [width, setWidth] = useState(0)

  // A grid may expand one item: `{ id, length, padding }`.
  // Its expansion shows `length` items in the grid's columns.
  // The layout depends on these values, not the object.
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

  let handleResize = (size) => {
    setHeight(size.height)
    setWidth(itemWidth > 0 ? size.width : 0)
  }

  return [layout, handleResize]
}
