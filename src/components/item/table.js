'use strict'

const React = require('react')
const PropTypes = require('prop-types')
const { arrayOf, func, object } = PropTypes
const { ItemIterator } = require('./iterator')
const { ItemTableRow } = require('./table-row')
const { ItemTableHead } = require('./table-head')
const cx = require('classnames')
const { noop } = require('../../common/util')
const { ROW } = require('../../constants/sass')

class ItemTable extends ItemIterator {
  componentDidUpdate() {
    if (this.props.edit != null) {
      for (let id in this.props.edit) {
        this.scrollIntoView({ id: Number(id) }, false)
      }
    }
  }

  get classes() {
    return ['table-body', {
      'drop-target': !this.props.isDisabled,
      'over': this.props.isOver
    }]
  }

  getColumns() {
    return 1
  }

  getRowHeight() {
    return ROW.HEIGHT
  }

  handleChange = (...args) => {
    this.props.onMetadataSave(...args)
    this.container.focus()
  }

  handleEditCancel = (...args) => {
    this.props.onEditCancel(...args)
    this.container.focus()
  }

  edit(item) {
    const { property } = this.props.columns[0]
    this.props.onEdit({
      column: { [item.id]: property.id }
    })
  }


  renderTableBody() {
    const { columns, data, edit } = this.props
    const onEdit = this.props.selection.length === 1 ? this.props.onEdit : noop

    const { offset, height } = this.state
    const transform = `translate3d(0,${offset}px,0)`

    return this.connect(
      <div
        className={cx(this.classes)}
        onClick={this.handleClickOutside}>
        <div
          className="scroll-container"
          ref={this.setContainer}
          tabIndex={this.tabIndex}
          onKeyDown={this.handleKeyDown}>
          <div className="runway click-catcher" style={{ height }}>
            <table className="viewport" style={{ transform }}>
              <tbody>
                {this.mapIterableRange(({ item, ...props }) =>
                  <ItemTableRow {...props}
                    key={item.id}
                    item={item}
                    data={data[item.id]}
                    columns={columns}
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
      <div className="item table">
        <ItemTableHead
          columns={this.props.columns}
          sort={this.props.sort}
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
    onEdit: func.isRequired,
    onEditCancel: func.isRequired,
    onMetadataSave: func.isRequired
  }

  static defaultProps = {
    ...ItemIterator.defaultProps,
    overscan: 2
  }
}


module.exports = {
  ItemTable
}
