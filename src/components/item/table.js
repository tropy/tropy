'use strict'

const React = require('react')
const PropTypes = require('prop-types')
const { arrayOf, func, object } = PropTypes
const { ItemIterator } = require('./iterator')
const { ItemTableRow } = require('./table-row')
const { ItemTableHead } = require('./table-head')
const cx = require('classnames')
const { on, off } = require('../../dom')
const { noop } = require('../../common/util')
const { ROW } = require('../../constants/sass')

const SCROLL_OPTIONS = {
  capture: true,
  passive: true
}

class ItemTable extends ItemIterator {
  constructor(props) {
    super(props)
    this.state.offset = 0
  }

  componentDidMount() {
    super.componentDidMount()
    on(this.scroller, 'scroll', this.handleScroll, SCROLL_OPTIONS)
  }

  componentWillUnmount() {
    super.componentWillUnmount()
    off(this.scroller, 'scroll', this.handleScroll, SCROLL_OPTIONS)
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

  setScroller = (scroller) => {
    this.scroller = scroller
  }

  handleEditCancel = (...args) => {
    this.props.onEditCancel(...args)
    this.container.focus()
  }

  handleScroll = () => {
    this.setState({ offset: this.scroller.scrollTop })
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

    const { height, offset, overflow, rowHeight, viewportRows } = this.state

    const top = offset < overflow ? 0 : offset - (offset % rowHeight)
    const first = Math.floor(top / rowHeight)

    const transform = `translate3d(0,${top}px,0)`
    const items = this.props.items.slice(first, first + viewportRows * 2)

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
