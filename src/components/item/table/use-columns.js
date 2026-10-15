import { useCallback, useLayoutEffect, useRef, useState } from 'react'
import { useDerivedState } from '../../../hooks/use-derived-state.js'
import { useEvent } from '../../../hooks/use-event.js'
import { bounds, ensure } from '../../../dom.js'
import { restrict, splice, warp } from '../../../common/util.js'
import { NAV, SASS } from '../../../constants/index.js'

const { COLUMN } = SASS

// The position of x in the table, relative to its scroll offset.
const offsetInTable = (table, x, { offset = 0, min, max } = {}) =>
  restrict(
    x - offset - bounds(table).left + table.scrollLeft,
    min,
    max)

const setColumnOffset = (table, offset = 0, column = 'drag') => {
  table?.style.setProperty(`--${column}-offset`, `${offset}px`)
}

// The active columns and their widths: derived from the columns
// prop (reset when it changes); resized and reordered locally,
// committed via onColumnResize and onColumnOrder.
export function useColumnState ({
  columns,
  list,
  minColWidth = 40,
  minMainColWidth = 100,
  onColumnOrder,
  onColumnResize
}) {
  let derive = useCallback(({ active }) => ({
    columns: active,
    colwidth: active.map((c, idx) =>
      Math.max(c.width, idx > 0 ? minColWidth : minMainColWidth))
  }), [minColWidth, minMainColWidth])

  let [state, setState] = useDerivedState(columns, derive)

  let hasPositionColumn = !!list
  let minWidth = state.colwidth.reduce((sum, w) => sum + w, 0) +
    (hasPositionColumn ? NAV.COLUMN.POSITION.width : 0)

  // Handlers passed to TableHead (a PureComponent) are stable.
  let resize = useEvent(({ column, width }, doCommit) => {
    setState({
      ...state,
      colwidth: splice(state.colwidth, column, 1, width)
    })

    if (doCommit)
      onColumnResize({ column, width })
  })

  let order = (from, to) => {
    let next = warp(state.columns, from, to)

    setState({
      columns: next,
      colwidth: next.map(c => c.width)
    })

    onColumnOrder({
      order: next.reduce((ord, col, idx) => ((ord[col.id] = idx), ord), {})
    })
  }

  return {
    ...state,
    hasPositionColumn,
    minColWidth,
    minMainColWidth,
    minWidth,
    order,
    resize
  }
}

// Reordering columns by dragging their heads.
// The dragged and the displaced column move via CSS offsets
// on the table (--drag-offset, --drop-offset).
export function useColumnDrag (table, {
  colwidth,
  hasPositionColumn,
  minWidth,
  order
}) {
  let dragstate = useRef({})
  let isOrdered = useRef(false)
  let [drag, setDrag] = useState(null)
  let [drop, setDrop] = useState(null)

  // Reset the offsets once the new order is rendered.
  useLayoutEffect(() => {
    if (isOrdered.current) {
      isOrdered.current = false
      setColumnOffset(table.current, 0)
      setColumnOffset(table.current, 0, 'drop')
    }
  })

  let reset = useEvent(() => {
    ensure(table.current, 'transitionend', () => {
      setDrop(null)
    }, 400)

    setDrag(null)
    dragstate.current = {}
    setColumnOffset(table.current, 0)
    setColumnOffset(table.current, 0, 'drop')
  })

  let onOrderStart = useEvent((idx, event) => {
    let min = hasPositionColumn ? NAV.COLUMN.POSITION.width : 0
    let max = minWidth - colwidth[idx]
    let offset = event.nativeEvent.offsetX +
      ((idx === 0 && !hasPositionColumn) ?
        COLUMN.PADDING + COLUMN.FIRST :
        COLUMN.PADDING)
    let origin = offsetInTable(table.current, event.clientX, {
      min, max, offset
    })

    dragstate.current = { max, min, idx, offset, origin }
  })

  let onOrder = useEvent((event) => {
    let { idx, origin } = dragstate.current
    let delta = offsetInTable(
      table.current, event.clientX, dragstate.current) - origin
    let tgt = idx
    let mov = delta

    if (delta > 0) {
      while (tgt < colwidth.length - 1 && colwidth[tgt + 1] / 2 < mov) {
        tgt += 1
        mov -= colwidth[tgt]
      }
    } else {
      mov = -mov
      while (tgt > 0 && colwidth[tgt - 1] / 2 < mov) {
        tgt -= 1
        mov -= colwidth[tgt]
      }
    }

    setDrag(idx)
    setDrop(tgt)
    setColumnOffset(table.current, delta)
    setColumnOffset(table.current,
      (tgt === idx) ? 0 : (tgt < idx) ? colwidth[idx] : -colwidth[idx],
      'drop')
  })

  let onOrderStop = useEvent(() => {
    if (drag === drop)
      return reset()

    dragstate.current = {}
    isOrdered.current = true
    setDrag(null)
    setDrop(null)
    order(drag, drop)
  })

  return {
    drag,
    drop,
    onOrder,
    onOrderReset: reset,
    onOrderStart,
    onOrderStop
  }
}

// The column picker in the table head: inserts at the position
// of the click.
export function useColumnContextMenu (table, {
  colwidth,
  columns,
  hasPositionColumn,
  minMainColWidth,
  onColumnInsert,
  onColumnRemove
}) {
  let [menu, setMenu] = useState(null)

  let show = useEvent((event) => {
    event.stopPropagation()

    let opt = (event.altKey || event.shiftKey) ? 'all' : 'common'
    let min = hasPositionColumn ? NAV.COLUMN.POSITION.width : 0
    let n = offsetInTable(table.current, event.clientX, { min })
    let idx = 0
    let k = 0

    while (idx < colwidth.length && k < n) {
      k += colwidth[idx]
      if (k - colwidth[idx] / 2 <= n) ++idx
    }

    setMenu({
      idx,
      left: event.clientX,
      options: columns[opt],
      top: event.clientY,
      value: columns.active.map(col => col.id)
    })
  })

  let hide = () => {
    setMenu(null)
  }

  let insert = (id) => {
    onColumnInsert({ id, width: minMainColWidth }, { idx: menu.idx })
  }

  let remove = (id) => {
    onColumnRemove({ id })
  }

  return { menu, hide, insert, remove, show }
}
