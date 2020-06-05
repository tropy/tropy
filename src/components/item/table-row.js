'use strict'

const React = require('react')
const { ItemIterable } = require('./iterable')
const { ItemTableCell } = require('./table-cell')
const { get, pick } = require('../../common/util')
const { NAV, TYPE } = require('../../constants')
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

  getNextColumn = (at = 0, dir = 1) => {
    let { columns } = this.props
    for (let k = 1, N = columns.length; k < N; ++k) {
      let column = columns[(N + at + k * dir) % N]
      if (column.protected) continue
      return column.id
    }
  }

  getPrevColumn = (at = 0) => (
    this.getNextColumn(at, -1)
  )

  getColumnProps(column, idx) {
    let isMainColumn = (idx === 0)
    let isItemColumn = this.isItemColumn(column.id)
    let type, value

    if (isItemColumn) {
      type = column.type
      value = this.props.item[isItemColumn]

    } else {
      let data = this.props.data[column.id]

      if (data != null) {
        type = data.type
        value = data.text
      }
    }

    let props = {
      id: column.id,
      isDragging: this.isDragging(idx),
      isEditing: this.isEditing(column.id),
      isMainColumn,
      isMoving: this.isMoving(idx),
      isReadOnly: this.props.isReadOnly || !!column.protected,
      position: idx,
      type,
      value
    }

    if (isMainColumn) {
      pick(this.props, MainCellProps, props)
      props.title = value
    }

    if (column.id === 'item.template') {
      props.title = value
      props.display = get(this.props.template, ['name'])
    }

    return props
  }

  getTemplateFieldType(id) {
    let fields = get(this.props.template, ['fields'])
    if (fields == null) return null
    let field = fields.find(f => f.property === id)
    if (field == null) return null
    return field.datatype

  }

  handleChange = (id, value) => {
    if (value.type == null) {
      value.type = this.getTemplateFieldType(id) || TYPE.TEXT
    }

    this.props.onChange({
      id: this.props.item.id,
      data: { [id]: value }
    })
  }

  render() {
    let props = pick(this.props, CellProps)

    return this.connect(
      <div
        className={cx('tr', this.classes)}
        ref={this.setContainer}
        onMouseDown={this.handleMouseDown}
        onClick={this.handleClick}
        onDoubleClick={this.handleOpen}
        onContextMenu={this.handleContextMenu}>
        {this.props.hasPositionColumn &&
          <ItemTableCell {...props}
            isReadOnly
            id={NAV.COLUMN.POSITION.id}
            type={NAV.COLUMN.POSITION.type}
            value={this.props.position}/>}
        {this.props.columns.map((column, idx) =>
          <ItemTableCell
            key={column.id}
            {...props}
            {...this.getColumnProps(column, idx)}
            getNextColumn={this.getNextColumn}
            getPrevColumn={this.getPrevColumn}
            onChange={this.handleChange}/>)}
      </div>
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
    position: number.isRequired,
    template: object
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
