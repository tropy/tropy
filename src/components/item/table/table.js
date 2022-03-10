import React from 'react'
import { arrayOf, bool, func, number, object, shape } from 'prop-types'
import { Scroll, ScrollContainer } from '../../scroll'
import { ItemIterator } from '../iterator'
import { TableRow } from './row'
import { TableHead } from './head'
import { ColumnContextMenu } from '../column'
import cx from 'classnames'
import { noop } from '../../../common/util'
import { bounds, ensure } from '../../../dom'
import { restrict, shallow, splice, warp } from '../../../common/util'

import {
  NAV,
  SASS
} from '../../../constants'

const { COLUMN, ROW } = SASS
const any = (src) => { for (let key in src) return key }

export class ItemTable extends ItemIterator {
  headContainer = React.createRef()

  constructor(props) {
    super(props)
    this.state = this.getColumnState(props)
  }

  componentDidUpdate() {
    if (this.props.edit != null) {
      this.container.current?.scrollIntoView({
        id: Number(any(this.props.edit))
      })
    }
  }

  UNSAFE_componentWillReceiveProps(props) {
    // super.UNSAFE_componentWillReceiveProps(props, ...args)
    if (!shallow(this.props, props, ['columns', 'list'])) {
      this.setState(this.getColumnState(props))
    }
  }

  get classes() {
    return ['table-body', {
      'drop-target': !this.props.isReadOnly,
      'over': this.props.isOver
    }]
  }

  getColumnState(props = this.props) {
    let minWidth = 0
    let columns = props.columns.active
    let colwidth = columns.map((c, idx) => {
      let min = idx > 0 ? props.minColWidth : props.minMainColWidth
      let width = Math.max(c.width, min)
      minWidth += width
      return width
    })

    if (this.hasPositionColumn(props)) {
      minWidth += NAV.COLUMN.POSITION.width
    }

    return { columns, colwidth, minWidth }
  }

  getMaxColumnOffset(idx) {
    return this.state.minWidth - this.state.colwidth[idx]
  }

  getMinColumnOffset() {
    return this.hasPositionColumn() ? NAV.COLUMN.POSITION.width : 0
  }

  getColumnPadding(idx = 0) {
    return (idx === 0 && !this.hasPositionColumn()) ?
      COLUMN.PADDING + COLUMN.FIRST :
      COLUMN.PADDING
  }

  getOffsetInTable(x, { offset = 0, min, max } = this.dragstate) {
    return restrict(
      x - offset - bounds(this.table).left + this.table.scrollLeft,
      min,
      max)
  }

  getPosition(index) {
    return (this.props.sort.asc) ?
      index + 1 :
      this.props.items.length - index
  }

  getTemplateColumns() {
    let gtc = this.hasPositionColumn() ?
      `${NAV.COLUMN.POSITION.width}px ` : ''
    for (let width of this.state.colwidth)
      gtc += width + 'px '
    return gtc + 'auto'
  }

  edit(item) {
    if (!this.props.isReadOnly) {
      this.props.onEdit({
        column: { [item.id]: this.state.columns[0].id }
      })
    }
  }

  hasPositionColumn(props = this.props) {
    return !!props.list
  }

  handleChange = (...args) => {
    this.props.onMetadataSave(...args)
    this.container.current.focus()
  }

  handleEditCancel = (...args) => {
    this.props.onEditCancel(...args)
    this.container.current.focus()
  }

  handleColumnOrderStart = (idx, event) => {
    let min = this.getMinColumnOffset()
    let max = this.getMaxColumnOffset(idx)
    let offset = event.nativeEvent.offsetX + this.getColumnPadding(idx)
    let origin = this.getOffsetInTable(event.clientX, { min, max, offset })
    this.dragstate = { max, min, idx, offset, origin }
  }

  handleColumnOrderStop = () => {
    let { drag, drop } = this.state
    if (drag === drop) return this.handleColumnOrderReset()

    let columns = warp(this.state.columns, drag, drop)
    let colwidth = columns.map(c => c.width)

    this.dragstate = {}
    this.setState({ columns, colwidth, drag: null, drop: null }, () => {
      this.setColumnOffset(0)
      this.setColumnOffset(0, 'drop')
    })

    this.props.onColumnOrder({
      order: columns.reduce((ord, col, idx) => ((ord[col.id] = idx), ord), {})
    })
  }

  handleColumnOrderReset = () => {
    ensure(this.table, 'transitionend', () => {
      this.setState({ drop: null })
    }, 400)
    this.setState({ drag: null })
    this.dragstate = {}
    this.setColumnOffset(0)
    this.setColumnOffset(0, 'drop')
  }

  handleColumnOrder = (event) => {
    let { idx, origin } = this.dragstate
    let { colwidth } = this.state
    let offset = this.getOffsetInTable(event.clientX)
    let delta = offset - origin
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

    this.setState({ drag: idx, drop: tgt })
    this.setColumnOffset(delta)
    this.setColumnOffset(
      (tgt === idx) ? 0 : (tgt < idx) ? colwidth[idx] : -colwidth[idx], 'drop'
    )
  }

  handleColumnResize = ({ column, width }, doCommit) => {
    const prev = this.state.colwidth[column]

    this.setState({
      colwidth: splice(this.state.colwidth, column, 1, width),
      minWidth: this.state.minWidth - prev + width
    })

    if (doCommit) {
      this.props.onColumnResize({ column, width })
    }
  }

  showColumnContextMenu = (event) => {
    event.stopPropagation()

    let { colwidth } = this.state

    let opt = (event.altKey || event.shiftKey) ? 'all' : 'common'
    let min = this.getMinColumnOffset()
    let idx = 0
    let n = this.getOffsetInTable(event.clientX, { min })
    let k = 0

    while (idx < colwidth.length && k < n) {
      k += colwidth[idx]
      if (k - colwidth[idx] / 2 <= n) ++idx
    }

    this.setState({
      columnContextMenu: {
        idx,
        left: event.clientX,
        options: this.props.columns[opt],
        top: event.clientY,
        value: this.props.columns.active.map(col => col.id)
      }
    })
  }

  hideColumnContextMenu = () => {
    this.setState({ columnContextMenu: null })
  }

  handleColumnInsert = (id) => {
    let { idx } = this.state.columnContextMenu
    let { minMainColWidth: width } = this.props
    this.props.onColumnInsert({ id, width }, { idx })
  }

  handleColumnRemove = (id) => {
    this.props.onColumnRemove({ id })
  }

  handleNativeScroll = (event) => {
    this.headContainer.current.scroll(null, event.target.scrollLeft)
  }

  setColumnOffset(offset = 0, column = 'drag') {
    this.table.style.setProperty(`--${column}-offset`, `${offset}px`)
  }

  setTable = (table) => {
    this.table = table
  }

  renderTableBody() {
    return this.connect(
      <div className={cx(this.classes)}>
        <Scroll
          ref={this.container}
          sync={this.headContainer}
          tag="div"
          autoselect
          selectedItems={this.props.selection}
          items={this.props.items}
          itemHeight={ROW.HEIGHT}
          tabIndex={this.tabIndex}
          onClick={this.handleClickOutside}
          onKeyDown={this.handleKeyDown}
          onSelect={this.handleSelect}>
          {this.renderTableRow}
        </Scroll>
      </div>
    )
  }

  renderTableRow = (item, index, { isScrolling, ...props }) => {
    return (
      <TableRow
        {...this.getIterableProps(item, index)}
        {...props}
        key={item.id}
        columns={this.state.columns}
        data={this.props.data[item.id]}
        drag={this.state.drag}
        drop={this.state.drop}
        edit={this.props.edit}
        hasPositionColumn={this.hasPositionColumn()}
        isReadOnly={this.props.isReadOnly || isScrolling}
        item={item}
        index={index}
        position={this.getPosition(index)}
        template={this.props.templates[item.template]}
        onCancel={this.handleEditCancel}
        onChange={this.handleChange}
        onEdit={this.props.selection.length === 1 ? this.props.onEdit : noop}/>
    )
  }

  renderColumnContextMenu() {
    return this.state.columnContextMenu != null && (
      <ColumnContextMenu
        {...this.state.columnContextMenu}
        onInsert={this.handleColumnInsert}
        onRemove={this.handleColumnRemove}
        onClose={this.hideColumnContextMenu}/>
    )
  }

  render() {
    return (
      <div
        ref={this.setTable}
        className={cx('item-table', {
          'dragging-column': this.state.drop != null
        })}
        style={{
          '--item-min-width': this.state.minWidth + 'px',
          '--item-template-columns': this.getTemplateColumns()
        }}>
        <ScrollContainer
          ref={this.headContainer}
          sync={this.container}>
          <TableHead
            columns={this.state.columns}
            colwidth={this.state.colwidth}
            drag={this.state.drag}
            drop={this.state.drop}
            hasPositionColumn={this.hasPositionColumn()}
            minWidth={this.props.minColWidth}
            minWidthMain={this.props.minMainColWidth}
            sort={this.props.sort}
            onContextMenu={this.showColumnContextMenu}
            onOrder={this.handleColumnOrder}
            onOrderReset={this.handleColumnOrderReset}
            onOrderStart={this.handleColumnOrderStart}
            onOrderStop={this.handleColumnOrderStop}
            onResize={this.handleColumnResize}
            onSort={this.props.onSort}/>
        </ScrollContainer>
        {this.renderTableBody()}
        {this.renderColumnContextMenu()}
      </div>
    )
  }

  static propTypes = {
    ...ItemIterator.propTypes,
    columns: shape({
      active: arrayOf(object).isRequired,
      all: arrayOf(object).isRequired,
      common: arrayOf(object).isRequired
    }).isRequired,
    edit: object,
    data: object.isRequired,
    hasScrollbars: bool,
    minColWidth: number.isRequired,
    minMainColWidth: number.isRequired,
    templates: object.isRequired,
    onColumnInsert: func.isRequired,
    onColumnOrder: func.isRequired,
    onColumnRemove: func.isRequired,
    onColumnResize: func.isRequired,
    onEdit: func.isRequired,
    onEditCancel: func.isRequired,
    onMetadataSave: func.isRequired
  }

  static defaultProps = {
    ...ItemIterator.defaultProps,
    minColWidth: 40,
    minMainColWidth: 100
  }
}
