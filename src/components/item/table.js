'use strict'

const React = require('react')
const { arrayOf, bool, func, number, object, shape } = require('prop-types')
const { ItemIterator } = require('./iterator')
const { ItemTableRow } = require('./table-row')
const { ItemTableSpacer } = require('./table-spacer')
const { ItemTableHead } = require('./table-head')
const { ColumnContextMenu } = require('./column')
const cx = require('classnames')
const { noop } = require('../../common/util')
const { bounds, ensure, on, off, maxScrollLeft } = require('../../dom')
const { match } = require('../../keymap')
const { assign } = Object
const throttle = require('lodash.throttle')
const { refine, restrict, shallow, splice, warp } = require('../../common/util')

const {
  NAV,
  SASS: { COLUMN, ROW, SCROLLBAR }
} = require('../../constants')

const any = (src) => { for (let key in src) return key }

class ItemTable extends ItemIterator {
  constructor(props) {
    super(props)

    assign(this.state, this.getColumnState(props))

    refine(this, 'handleKeyDown', ([event]) => {
      if (event.isPropagationStopped()) return

      switch (match(this.props.keymap, event)) {
        case 'edit':
          this.edit(this.current())
          break
        default:
          return
      }

      event.preventDefault()
      event.stopPropagation()
      event.nativeEvent.stopImmediatePropagation()
    })
  }

  componentWillUnmount() {
    super.componentWillUnmount()
    if (this.table) {
      off(this.table, 'scroll', this.handleHorizontalScroll, {
        capture: true, passive: true
      })
    }
  }

  componentDidUpdate(...args) {
    super.componentDidUpdate(...args)
    if (this.props.edit != null) {
      this.scrollIntoView({ id: Number(any(this.props.edit)) }, false)
    }
  }

  componentWillReceiveProps(props, ...args) {
    super.componentWillReceiveProps(props, ...args)
    if (!shallow(this.props, props, ['columns', 'list'])) {
      this.setState({
        ...this.getColumnState(props),
        hasMaxScrollLeft: this.hasMaxScrollLeft()
      })
    }
  }

  get classes() {
    return ['table-body', {
      'drop-target': !this.props.isDisabled,
      'over': this.props.isOver
    }]
  }

  getStateFromProps(props = this.props) {
    return {
      ...super.getStateFromProps(props),
      hasMaxScrollLeft: this.hasMaxScrollLeft()
    }
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

    if (this.props.hasScrollbars) {
      minWidth += SCROLLBAR.WIDTH
    }

    return { columns, colwidth, minWidth }
  }

  getColumns() {
    return 1
  }

  getMaxColumnOffset(idx) {
    let max = this.state.minWidth - this.state.colwidth[idx]
    return (this.props.hasScrollbars) ? max - SCROLLBAR.WIDTH : max
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

  getRowHeight() {
    return ROW.HEIGHT
  }

  hasMaxScrollLeft(props = this.props) {
    return props.hasScrollbars &&
      this.table != null &&
      maxScrollLeft(this.table)
  }

  edit(item) {
    this.props.onEdit({
      column: { [item.id]: this.state.columns[0].id }
    })
  }

  handleChange = (...args) => {
    this.props.onMetadataSave(...args)
    this.container.focus()
  }

  handleEditCancel = (...args) => {
    this.props.onEditCancel(...args)
    this.container.focus()
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

  handleHorizontalScroll = throttle(() => {
    this.setState({
      hasMaxScrollLeft: this.hasMaxScrollLeft()
    })
  }, 25)

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

  setColumnOffset(offset = 0, column = 'drag') {
    this.table.style.setProperty(`--${column}-offset`, `${offset}px`)
  }

  setTable = (table) => {
    if (this.table) {
      off(this.table, 'scroll', this.handleHorizontalScroll, {
        capture: true, passive: true
      })
    }

    this.table = table

    if (this.table) {
      on(this.table, 'scroll', this.handleHorizontalScroll, {
        capture: true, passive: true
      })
    }
  }

  renderTableBody() {
    const { data, edit } = this.props
    const onEdit = this.props.selection.length === 1 ? this.props.onEdit : noop

    const { columns, colwidth, height, minWidth } = this.state
    const { transform } = this

    const hasPositionColumn = this.hasPositionColumn()

    return this.connect(
      <div
        className={cx(this.classes)}
        style={{ minWidth }}
        onClick={this.handleClickOutside}>
        <div
          className="scroll-container"
          ref={this.setContainer}
          tabIndex={this.tabIndex}
          onKeyDown={this.handleKeyDown}>
          <div className="runway click-catcher" style={{ height }}>
            <table className="viewport" style={{ transform }}>
              <ItemTableSpacer
                columns={columns}
                colwidth={colwidth}
                hasPositionColumn={hasPositionColumn}/>
              <tbody>
                {this.mapIterableRange(({ item, index, ...props }) =>
                  <ItemTableRow {...props}
                    key={item.id}
                    columns={columns}
                    data={data[item.id]}
                    drag={this.state.drag}
                    drop={this.state.drop}
                    edit={edit}
                    hasPositionColumn={hasPositionColumn}
                    item={item}
                    position={this.getPosition(index)}
                    onCancel={this.handleEditCancel}
                    onChange={this.handleChange}
                    onEdit={onEdit}/>)}
              </tbody>
            </table>
          </div>
        </div>
      </div>
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
    return (this.props.isEmpty) ? this.renderNoItems() : (
      <div
        ref={this.setTable}
        className={cx('item-table', {
          'dragging-column': this.state.drop != null,
          'max-scroll-left': this.state.hasMaxScrollLeft
        })}>
        <ItemTableHead
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
    hasScrollbars: bool.isRequired,
    minColWidth: number.isRequired,
    minMainColWidth: number.isRequired,
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
    overscan: 2,
    hasScrollbars: ARGS.scrollbars,
    minColWidth: 40,
    minMainColWidth: 100
  }
}


module.exports = {
  ItemTable
}
