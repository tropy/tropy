'use strict'

const React = require('react')
const { arrayOf, bool, func, object } = require('prop-types')
const { ItemIterator } = require('./iterator')
const { ItemTableRow } = require('./table-row')
const { ItemTableSpacer } = require('./table-spacer')
const { ItemTableHead } = require('./table-head')
const cx = require('classnames')
const { noop } = require('../../common/util')
const { NAV, SASS: { ROW, SCROLLBAR } } = require('../../constants')
const { on, off, maxScrollLeft } = require('../../dom')
const { match } = require('../../keymap')
const { moveById, pick, refine, shallow, splice } = require('../../common/util')
const { assign } = Object
const throttle = require('lodash.throttle')


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

  componentDidUpdate() {
    if (this.props.edit != null) {
      for (let id in this.props.edit) {
        this.scrollIntoView({ id: Number(id) }, false)
      }
    }
  }

  componentWillReceiveProps(props) {
    super.componentWillReceiveProps(props)
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

  update(props = this.props) {
    super.update(props)
    this.setState({
      hasMaxScrollLeft: this.hasMaxScrollLeft()
    })
  }

  getColumnState(props = this.props) {
    let minWidth = 0
    let columns = props.columns
    let colwidth = columns.map(c => ((minWidth += c.width), c.width))

    if (this.hasPositionColumn(props)) {
      minWidth += NAV.COLUMN.POSITION.width
    }

    if (this.props.hasScrollbars) {
      minWidth += SCROLLBAR.WIDTH
    }

    return {
      columns,
      colwidth,
      minWidth
    }
  }

  getColumns() {
    return 1
  }

  getPosition(index) {
    return (this.props.sort.asc) ?
      index + 1 :
      this.props.items.length - index
  }

  getRowHeight() {
    return ROW.HEIGHT
  }

  hasMaxScrollLeft() {
    return this.props.hasScrollbars &&
      this.table != null &&
      maxScrollLeft(this.table)
  }

  edit(item) {
    const { property } = this.state.columns[0]
    this.props.onEdit({
      column: { [item.id]: property.id }
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

  handleColumnOrderStart = () => {
    this.oc = pick(this.state, ['columns', 'colwidth'])
  }

  handleColumnOrderStop = () => {
    this.oc = null
  }

  handleColumnOrderReset = () => {
    this.setState(this.oc)
    this.oc = null
  }

  handleColumnOrder = (from, to, offset) => {
    const columns = moveById(this.state.columns, from, to, offset)
    const colwidth = columns.map(c => c.width)
    this.setState({ columns, colwidth })
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
                    item={item}
                    data={data[item.id]}
                    columns={columns}
                    position={this.getPosition(index)}
                    hasPositionColumn={hasPositionColumn}
                    edit={edit}
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

  render() {
    return (this.props.isEmpty) ? this.renderNoItems() : (
      <div
        ref={this.setTable}
        className={cx('item-table', {
          'max-scroll-left': this.state.hasMaxScrollLeft
        })}>
        <ItemTableHead
          columns={this.state.columns}
          colwidth={this.state.colwidth}
          hasPositionColumn={this.hasPositionColumn()}
          sort={this.props.sort}
          onOrder={this.handleColumnOrder}
          onOrderReset={this.handleColumnOrderReset}
          onOrderStart={this.handleColumnOrderStart}
          onOrderStop={this.handleColumnOrderStop}
          onResize={this.handleColumnResize}
          onSort={this.props.onSort}/>
        {this.renderTableBody()}
      </div>
    )
  }

  static propTypes = {
    ...ItemIterator.propTypes,
    columns: arrayOf(object).isRequired,
    edit: object,
    data: object.isRequired,
    hasScrollbars: bool.isRequired,
    onColumnResize: func.isRequired,
    onEdit: func.isRequired,
    onEditCancel: func.isRequired,
    onMetadataSave: func.isRequired
  }

  static defaultProps = {
    ...ItemIterator.defaultProps,
    overscan: 2,
    hasScrollbars: ARGS.scrollbars
  }
}


module.exports = {
  ItemTable
}
