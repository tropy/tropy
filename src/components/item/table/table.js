import React, { useRef } from 'react'
import { Scroll, ScrollContainer } from '../../scroll/index.js'
import { TableRow } from './row.js'
import { TableHead } from './head.js'
import { ColumnContextMenu } from '../column.js'
import cx from 'classnames'
import { noop } from '../../../common/util.js'
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
  let { columns, isReadOnly, onEdit } = props
  let table = useRef()

  let iterator = useItemIterator(props, {
    tabIndex: TABS.ItemTable,
    edit (item) {
      if (item != null && !isReadOnly)
        onEdit({ column: { [item.id]: columns.active[0].id } })
    }
  })

  let columnState = useColumnState(props)
  let columnDrag = useColumnDrag(table, columnState)

  let columnMenu = useColumnContextMenu(table, {
    ...props,
    colwidth: columnState.colwidth,
    hasPositionColumn: columnState.hasPositionColumn
  })

  return (
    <ItemTableView
      {...props}
      columnDrag={columnDrag}
      columnMenu={columnMenu}
      columnState={columnState}
      iterator={iterator}
      table={table}/>
  )
}

class ItemTableView extends React.Component {
  get container () {
    return this.props.iterator.scroll
  }

  componentDidUpdate () {
    if (this.props.edit != null) {
      this.container.current?.scrollIntoView({
        id: Number(any(this.props.edit))
      })
    }
  }

  get classes () {
    return ['table-body', {
      over: this.props.iterator.isOver
    }]
  }

  getPosition (index) {
    return (this.props.sort.asc) ?
      index + 1 :
      this.props.items.length - index
  }

  getTemplateColumns () {
    let { colwidth, hasPositionColumn } = this.props.columnState
    let gtc = hasPositionColumn ?
      `${NAV.COLUMN.POSITION.width}px ` : ''
    for (let width of colwidth)
      gtc += width + 'px '
    return gtc + 'auto'
  }

  handleChange = (...args) => {
    this.props.onMetadataSave(...args)
    this.container.current.focus()
  }

  handleEditCancel = (...args) => {
    this.props.onEditCancel(...args)
    this.container.current.focus()
  }

  handleHeadWheel = ({ deltaX, deltaY }) => {
    if (Math.abs(deltaX) > Math.abs(deltaY))
      this.container.current.scrollBy(null, deltaX)
    else
      this.container.current.scrollBy(deltaY)
  }

  renderTableBody () {
    let { iterator } = this.props

    return iterator.connect(
      <div className={cx(this.classes)}>
        <Scroll
          ref={iterator.scroll}
          tag="div"
          autoselect
          cursor={this.props.selection.cursor}
          items={this.props.items}
          itemHeight={ROW.HEIGHT}
          tabIndex={iterator.tabIndex}
          onClick={iterator.clearSelection}
          onKeyDown={iterator.onKeyDown}
          onSelect={iterator.handleSelectItem}>
          {this.renderTableRow}
        </Scroll>
      </div>
    )
  }

  renderTableRow = (item, index, { isScrolling }) => {
    let { columnDrag, columnState } = this.props

    return (
      <TableRow
        {...this.props.iterator.getIterableProps(item, index)}
        key={item.id}
        columns={columnState.columns}
        data={this.props.data[item.id]}
        drag={columnDrag.drag}
        drop={columnDrag.drop}
        edit={this.props.edit}
        hasPositionColumn={columnState.hasPositionColumn}
        isReadOnly={this.props.isReadOnly || isScrolling}
        item={item}
        position={this.getPosition(index)}
        template={this.props.templates[item.template]}
        onCancel={this.handleEditCancel}
        onChange={this.handleChange}
        onEdit={this.props.selection.size === 1 ? this.props.onEdit : noop}/>
    )
  }

  renderColumnContextMenu () {
    let { columnMenu } = this.props

    return columnMenu.menu != null && (
      <ColumnContextMenu
        {...columnMenu.menu}
        onInsert={columnMenu.insert}
        onRemove={columnMenu.remove}
        onClose={columnMenu.hide}/>
    )
  }

  render () {
    let { columnDrag, columnMenu, columnState } = this.props

    return (
      <div
        ref={this.props.table}
        className={cx('item-table', {
          'dragging-column': columnDrag.drop != null
        })}
        style={{
          '--item-min-width': columnState.minWidth + 'px',
          '--item-template-columns': this.getTemplateColumns()
        }}>
        <ScrollContainer onWheel={this.handleHeadWheel}>
          <TableHead
            columns={columnState.columns}
            colwidth={columnState.colwidth}
            drag={columnDrag.drag}
            drop={columnDrag.drop}
            hasPositionColumn={columnState.hasPositionColumn}
            minWidth={this.props.minColWidth}
            minWidthMain={this.props.minMainColWidth}
            sort={this.props.sort}
            onContextMenu={columnMenu.show}
            onOrder={columnDrag.onOrder}
            onOrderReset={columnDrag.onOrderReset}
            onOrderStart={columnDrag.onOrderStart}
            onOrderStop={columnDrag.onOrderStop}
            onResize={columnState.resize}
            onSort={this.props.onSort}/>
        </ScrollContainer>
        {this.renderTableBody()}
        {this.renderColumnContextMenu()}
      </div>
    )
  }

  static defaultProps = {
    minColWidth: 40,
    minMainColWidth: 100
  }
}
