import { useEffect, useRef } from 'react'
import { useDispatch } from 'react-redux'
import { Scroll, ScrollContainer } from '../../scroll/index.js'
import { TableRow } from './row.js'
import { TableHead } from './head.js'
import { ColumnContextMenu } from '../column.js'
import cx from 'classnames'
import { useActions } from '../../../hooks/use-action.js'
import { useEvent } from '../../../hooks/use-event.js'
import { getAllColumns, getSortColumn } from '../../../selectors/index.js'
import * as act from '../../../actions/index.js'
import {
  useItemIterator,
  useItemIteratorProps,
  useProp
} from '../use-item-iterator.js'

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

// Module-level, so useActions returns stable handlers.
const ACTIONS = [
  'edit.start',
  'edit.cancel',
  'nav.column.insert',
  'nav.column.order',
  'nav.column.remove',
  'nav.column.resize',
  'metadata.save'
]

// The store state and actions of the table
// (besides those shared with the grid).
const useItemTableProps = (props) => {
  let dispatch = useDispatch()

  let [
    onEdit,
    onEditCancel,
    onColumnInsert,
    onColumnOrder,
    onColumnRemove,
    onColumnResize,
    onMetadataSave
  ] = useActions(ACTIONS)

  let onSort = useEvent((opts) => {
    dispatch(act.nav.sort({ ...opts, list: props.list }))
  })

  return {
    columns: useProp(props, 'columns', getAllColumns),
    data: useProp(props, 'data', s => s.metadata),
    edit: useProp(props, 'edit', s => s.edit.column),
    sort: useProp(props, 'sort', getSortColumn),
    templates: useProp(props, 'templates', s => s.ontology.template),
    onColumnInsert,
    onColumnOrder,
    onColumnRemove,
    onColumnResize,
    onEdit,
    onEditCancel,
    onMetadataSave,
    onSort,
    ...props
  }
}

export const ItemTable = (ownProps) => {
  let props = useItemTableProps(useItemIteratorProps(ownProps))
  let {
    columns,
    data,
    edit,
    isReadOnly,
    items,
    minColWidth = 40,
    minMainColWidth = 100,
    selection,
    sort,
    templates,
    onEdit,
    onEditCancel,
    onMetadataSave,
    onSort
  } = props

  let table = useRef()

  let iterator = useItemIterator(props, {
    tabIndex: TABS.ItemTable,
    edit (item) {
      if (item != null && !isReadOnly)
        onEdit({ column: { [item.id]: columns.active[0].id } })
    }
  })

  let { scroll } = iterator

  let columnState = useColumnState(props)
  let columnDrag = useColumnDrag(table, columnState)

  let columnMenu = useColumnContextMenu(table, {
    ...props,
    colwidth: columnState.colwidth,
    hasPositionColumn: columnState.hasPositionColumn
  })

  // Keep the edited item in view when editing starts.
  useEffect(() => {
    if (edit != null)
      scroll.current?.scrollIntoView({ id: Number(any(edit)) })
  }, [edit, scroll])

  // Rows are memoized: these handlers are stable.
  let handleChange = useEvent((...args) => {
    onMetadataSave(...args)
    scroll.current.focus()
  })

  let handleEditCancel = useEvent((...args) => {
    onEditCancel(...args)
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
          minWidth={minColWidth}
          minWidthMain={minMainColWidth}
          sort={sort}
          onContextMenu={columnMenu.show}
          onOrder={columnDrag.onOrder}
          onOrderReset={columnDrag.onOrderReset}
          onOrderStart={columnDrag.onOrderStart}
          onOrderStop={columnDrag.onOrderStop}
          onResize={columnState.resize}
          onSort={onSort}/>
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
                edit={edit}
                hasPositionColumn={columnState.hasPositionColumn}
                isOnlySelected={selection.size === 1 && selection.has(item.id)}
                isReadOnly={isReadOnly || isScrolling}
                item={item}
                position={getPosition(index)}
                template={templates[item.template]}
                onCancel={handleEditCancel}
                onChange={handleChange}
                onEdit={onEdit}/>
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
