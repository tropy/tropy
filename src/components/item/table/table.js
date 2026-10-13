import { useEffect, useRef } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Scroll, ScrollContainer } from '../../scroll/index.js'
import { TableRow } from './row.js'
import { TableHead } from './head.js'
import { ColumnContextMenu } from '../column.js'
import cx from 'classnames'
import { useEvent } from '../../../hooks/use-event.js'
import { getAllColumns, getSortColumn } from '../../../selectors/index.js'
import * as act from '../../../actions/index.js'
import { useItemIterator } from '../use-item-iterator.js'

import {
  useColumnContextMenu,
  useColumnDrag,
  useColumnState
} from './use-columns.js'

import {
  NAV,
  SASS,
  TABS
} from '../../../constants/index.js'

const { ROW } = SASS
const any = (src) => { for (let key in src) return key }

export const ItemTable = (props) => {
  let { isReadOnly, list } = props

  let dispatch = useDispatch()

  let columns = useSelector(getAllColumns)
  let data = useSelector(state => state.metadata)
  let edit = useSelector(state => state.edit.column)
  let sort = useSelector(getSortColumn)
  let templates = useSelector(state => state.ontology.template)

  // Rows and the head are memoized: these handlers are stable.
  let handleEdit = useEvent((payload) => {
    dispatch(act.edit.start(payload))
  })

  let handleSort = useEvent((opts) => {
    dispatch(act.nav.sort({ ...opts, list }))
  })

  let table = useRef()

  let iterator = useItemIterator(props, {
    tabIndex: TABS.ItemTable,
    edit (item) {
      if (item != null && !isReadOnly)
        handleEdit({ column: { [item.id]: columns.active[0].id } })
    }
  })

  let { items, scroll, selection } = iterator

  let columnState = useColumnState({
    columns,
    list,
    onColumnOrder: (payload) => dispatch(act.nav.column.order(payload)),
    onColumnResize: (payload) => dispatch(act.nav.column.resize(payload))
  })

  let columnDrag = useColumnDrag(table, columnState)

  let columnMenu = useColumnContextMenu(table, {
    colwidth: columnState.colwidth,
    columns,
    hasPositionColumn: columnState.hasPositionColumn,
    minMainColWidth: columnState.minMainColWidth,
    onColumnInsert: (payload, meta) =>
      dispatch(act.nav.column.insert(payload, meta)),
    onColumnRemove: (payload) =>
      dispatch(act.nav.column.remove(payload))
  })

  // Keep the edited item in view when editing starts.
  useEffect(() => {
    if (edit != null)
      scroll.current?.scrollIntoView({ id: Number(any(edit)) })
  }, [edit, scroll])

  let handleChange = useEvent((...args) => {
    dispatch(act.metadata.save(...args))
    scroll.current.focus()
  })

  let handleEditCancel = useEvent((...args) => {
    dispatch(act.edit.cancel(...args))
    scroll.current.focus()
  })

  let handleHeadWheel = ({ deltaX, deltaY }) => {
    if (Math.abs(deltaX) > Math.abs(deltaY))
      scroll.current.scrollBy(null, deltaX)
    else
      scroll.current.scrollBy(deltaY)
  }

  let getPosition = (index) =>
    sort.asc ? index + 1 : items.length - index

  let templateColumns = (columnState.hasPositionColumn ?
    `${NAV.COLUMN.POSITION.width}px ` : '') +
    columnState.colwidth.map(width => `${width}px `).join('') +
    'auto'

  return (
    <div
      ref={table}
      className={cx('item-table', {
        'dragging-column': columnDrag.drop != null
      })}
      style={{
        '--item-min-width': columnState.minWidth + 'px',
        '--item-template-columns': templateColumns
      }}>
      <ScrollContainer onWheel={handleHeadWheel}>
        <TableHead
          columns={columnState.columns}
          colwidth={columnState.colwidth}
          drag={columnDrag.drag}
          drop={columnDrag.drop}
          hasPositionColumn={columnState.hasPositionColumn}
          minWidth={columnState.minColWidth}
          minWidthMain={columnState.minMainColWidth}
          sort={sort}
          onContextMenu={columnMenu.show}
          onOrder={columnDrag.onOrder}
          onOrderReset={columnDrag.onOrderReset}
          onOrderStart={columnDrag.onOrderStart}
          onOrderStop={columnDrag.onOrderStop}
          onResize={columnState.resize}
          onSort={handleSort}/>
      </ScrollContainer>
      {iterator.connect(
        <div className={cx('table-body', { over: iterator.isOver })}>
          <Scroll
            ref={scroll}
            tag="div"
            autoselect
            cursor={selection.cursor}
            items={items}
            itemHeight={ROW.HEIGHT}
            tabIndex={iterator.tabIndex}
            onClick={iterator.clearSelection}
            onKeyDown={iterator.onKeyDown}
            onSelect={iterator.handleSelectItem}>
            {(item, index, { isScrolling }) => (
              <TableRow
                {...iterator.getIterableProps(item, index)}
                key={item.id}
                columns={columnState.columns}
                data={data[item.id]}
                drag={columnDrag.drag}
                drop={columnDrag.drop}
                editing={edit?.[item.id]}
                hasPositionColumn={columnState.hasPositionColumn}
                isOnlySelected={selection.size === 1 && selection.has(item.id)}
                isReadOnly={isReadOnly || isScrolling}
                item={item}
                position={getPosition(index)}
                template={templates[item.template]}
                onCancel={handleEditCancel}
                onChange={handleChange}
                onEdit={handleEdit}/>
            )}
          </Scroll>
        </div>
      )}
      {columnMenu.menu != null && (
        <ColumnContextMenu
          {...columnMenu.menu}
          onInsert={columnMenu.insert}
          onRemove={columnMenu.remove}
          onClose={columnMenu.hide}/>
      )}
    </div>
  )
}
