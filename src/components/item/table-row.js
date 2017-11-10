'use strict'

const React = require('react')
const { ItemIterable } = require('./iterable')
const { BlankTableCell, ItemTableCell } = require('./table-cell')
const { get, pick } = require('../../common/util')
const { DC, COLUMNS: { PositionColumn } } = require('../../constants')
const cx = require('classnames')
const { arrayOf, object, bool } = require('prop-types')

const CellProps = Object.keys(ItemTableCell.propTypes)

class ItemTableRow extends ItemIterable {
  isMainColumn(id) {
    return DC.title === id
  }

  isEditing = (id) => {
    return get(this.props.edit, [this.props.item.id]) === id
  }

  mapColumns(fn) {
    const { columns } = this.props
    const mapped = new Array(columns.length)

    for (let i = 0, ii = columns.length; i < ii; ++i) {
      const column = columns[i]
      const isMainColumn = this.isMainColumn(column.property.id)

      mapped.push(fn({
        column,
        isMainColumn,
        next: columns[(i + 1) % ii],
        prev: columns[(ii + i - 1) % ii]
      }))
    }

    return mapped
  }

  render() {
    const { data, photos, tags, isSelected, ...props } = this.props

    return this.connect(
      <tr
        className={cx(this.classes)}
        ref={this.setContainer}
        onMouseDown={this.handleMouseDown}
        onClick={this.handleClick}
        onDoubleClick={this.handleOpen}
        onContextMenu={this.handleContextMenu}>
        {this.props.hasPositionColumn &&
          <ItemTableCell {...pick(props, CellProps)}
            property={{ id: PositionColumn.id }}
            width={PositionColumn.width}/>}
        {this.mapColumns(({ column, isMainColumn, next, prev }) =>
          <ItemTableCell {...pick(props, CellProps)}
            key={column.property.id}
            property={column.property}
            data={data}
            width={column.width}
            tags={isMainColumn ? tags : null}
            photos={isMainColumn ? photos : null}
            isEditing={this.isEditing(column.property.id)}
            isMainColumn={isMainColumn}
            isSelected={isSelected}
            nextColumn={next.property.id}
            prevColumn={prev.property.id}
            getSelection={this.props.getSelection}/>)}
        <BlankTableCell/>
      </tr>
    )
  }

  static propTypes = {
    ...ItemIterable.propTypes,
    edit: object,
    data: object.isRequired,
    columns: arrayOf(object).isRequired,
    hasPositionColumn: bool
  }

  static defaultProps = {
    ...ItemIterable.defaultProps,
    data: {}
  }
}


module.exports = {
  ItemTableRow: ItemTableRow.wrap()
}
