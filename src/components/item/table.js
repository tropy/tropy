'use strict'

const React = require('react')
const PropTypes = require('prop-types')
const { arrayOf, func, object } = PropTypes
const { ItemIterator } = require('./iterator')
const { ItemTableRow } = require('./table-row')
const { ItemTableHead } = require('./table-head')
const cx = require('classnames')
const { on, off } = require('../../dom')
const { noop, restrict } = require('../../common/util')
const { ROW } = require('../../constants/sass')

const SCROLL_OPTIONS = {
  capture: true,
  passive: true
}

class ItemTable extends ItemIterator {
  componentDidMount() {
    super.componentDidMount()
    on(this.scroller, 'scroll', this.handleScroll, SCROLL_OPTIONS)
  }

  componentWillUnmount() {
    super.componentWillUnmount()
    off(this.scroller, 'scroll', this.handleScroll, SCROLL_OPTIONS)
  }

  componentDidUpdate() {
    this.isUpdateScheduled = false
  }

  get classes() {
    return {
      'table-body': true,
      'drop-target': !this.props.isDisabled,
      'over': this.props.isOver
    }
  }

  getColumns() {
    return 1
  }

  getRowHeight() {
    return ROW.HEIGHT
  }

  getOffset() {
    if (this.scroller == null) return 0

    const { overflow, maxOffset, rowHeight } = this.state
    const offset = this.scroller.scrollTop

    return restrict(offset - (offset % rowHeight) - overflow, 0, maxOffset)
  }

  setScroller = (scroller) => {
    this.scroller = scroller
  }

  handleEditCancel = (...args) => {
    this.props.onEditCancel(...args)
    this.container.focus()
  }

  handleScroll = () => {
    if (!this.isUpdateScheduled) {
      this.isUpdateScheduled = true
      requestAnimationFrame(() => void this.forceUpdate())
    }
  }

  render() {
    if (this.props.isEmpty) return this.renderNoItems()

    const {
      columns,
      data,
      edit,
      sort,
      onMetadataSave,
      onSort
    } = this.props

    const onEdit = this.props.selection.length === 1 ? this.props.onEdit : noop

    const { height, rowHeight, viewportRows } = this.state

    const offset = this.getOffset()
    const start = Math.floor(offset / rowHeight)

    const transform = `translate3d(0,${offset}px,0)`
    const items = this.props.items.slice(start, start + viewportRows * 2)

    return (
      <div
        className="item table"
        ref={this.setContainer}
        tabIndex={this.tabIndex}
        onKeyDown={this.handleKeyDown}>
        <ItemTableHead columns={columns} sort={sort} onSort={onSort}/>

        {this.connect(
          <div
            className={cx(this.classes)}
            onClick={this.handleClickOutside}>
            <div
              ref={this.setScroller}
              className="scroll-container click-catcher">
              <div className="runway" style={{ height }}>
                <table style={{ transform }}>
                  <tbody>
                    {this.map(({ item, ...props }) => (
                      <ItemTableRow {...props}
                        key={item.id}
                        item={item}
                        data={data[item.id]}
                        columns={columns}
                        edit={edit}
                        onCancel={this.handleEditCancel}
                        onChange={onMetadataSave}
                        onEdit={onEdit}/>
                    ), items)}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  static propTypes = {
    ...ItemIterator.propTypes,
    columns: arrayOf(object).isRequired,
    edit: object,
    data: object.isRequired,
    onEdit: func.isRequired,
    onEditCancel: func.isRequired,
    onMetadataSave: func.isRequired
  }
}


module.exports = {
  ItemTable
}
