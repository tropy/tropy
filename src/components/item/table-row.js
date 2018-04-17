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

  isEditing = (id) => {
    return get(this.props.edit, [this.props.item.id]) === id
  }

  mapColumns(fn, columns = this.props.columns) {
    const cells = []

    for (let i = 0, ii = columns.length; i < ii; ++i) {
      const column = columns[i]
      const next = columns[(i + 1) % ii]
      const prev = columns[(ii + i - 1) % ii]
      const { property } = column
      const isMainColumn = (i === 0)

      const props = {
        key: property.id,
        id: property.id,
        isDragging: this.isDragging(i),
        isEditing: this.isEditing(property.id),
        isMainColumn,
        isMoving: this.isMoving(i),
        nextColumn: next.property.id,
        prevColumn: prev.property.id,
        type: get(this.props.data, [property.id, 'type']),
        value: get(this.props.data, [property.id, 'text'])
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
