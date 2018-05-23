'use strict'

const React = require('react')
const { ItemIterable } = require('./iterable')
const { BlankTableCell, ItemTableCell } = require('./table-cell')
const { get, pick } = require('../../common/util')
const { NAV } = require('../../constants')
const cx = require('classnames')
const { arrayOf, bool, number, object } = require('prop-types')

class ItemTableRow extends ItemIterable {
  isDragging(idx) {
    return idx === this.props.drag
  }

  isMoving(idx) {
    return (idx >= this.props.drop && idx < this.props.drag) ||
      (idx <= this.props.drop && idx > this.props.drag)
  }

  isItemColumn(id) {
    let idx = id.search(/^item\./)
    return -1 === idx ? false : id.slice(5)
  }

  isEditing = (id) => {
    return get(this.props.edit, [this.props.item.id]) === id
  }

  mapColumns(fn, columns = this.props.columns) {
    const cells = []
    const { data, item } = this.props

    for (let i = 0, ii = columns.length; i < ii; ++i) {
      let column = columns[i]
      let next = columns[(i + 1) % ii]
      let prev = columns[(ii + i - 1) % ii]
      let isMainColumn = (i === 0)
      let isItemColumn = this.isItemColumn(column.id)
      let type, value

      if (isItemColumn) {
        type = column.type
        value = item[isItemColumn]
      } else {
        type = get(data, [column.id, 'type'])
        value = get(data, [column.id, 'text'])
      }

      const props = {
        key: column.id,
        id: column.id,
        isDragging: this.isDragging(i),
        isEditing: this.isEditing(column.id),
        isMainColumn,
        isMoving: this.isMoving(i),
        isReadOnly: !!column.protected,
        nextColumn: next.id,
        prevColumn: prev.id,
        type,
        value
      }

      if (isMainColumn) {
        pick(this.props, MainCellProps, props)
      }

      cells.push(fn(props))
    }

    return cells
  }

  render() {
    const cellProps = pick(this.props, CellProps)

    return this.connect(
      <tr
        className={cx(this.classes)}
        ref={this.setContainer}
        onMouseDown={this.handleMouseDown}
        onClick={this.handleClick}
        onDoubleClick={this.handleOpen}
        onContextMenu={this.handleContextMenu}>
        {this.props.hasPositionColumn &&
          <ItemTableCell {...cellProps}
            isReadOnly
            id={NAV.COLUMN.POSITION.id}
            type={NAV.COLUMN.POSITION.type}
            value={this.props.position}/>}
        {this.mapColumns(props =>
          <ItemTableCell {...cellProps} {...props}/>)}
        <BlankTableCell/>
      </tr>
    )
  }

  static propTypes = {
    ...ItemIterable.propTypes,
    columns: arrayOf(object).isRequired,
    data: object.isRequired,
    drag: number,
    drop: number,
    edit: object,
    hasPositionColumn: bool,
    position: number.isRequired
  }

  static defaultProps = {
    ...ItemIterable.defaultProps,
    data: {}
  }
}

const MainCellProps = [
  'photos',
  'tags',
  'cache',
  'size',
  'onPhotoError'
]

const CellProps = [
  'isDisabled',
  'isSelected',
  'item',
  'getSelection',
  'onCancel',
  'onChange',
  'onEdit'
]


module.exports = {
  ItemTableRow: ItemTableRow.wrap()
}
