'use strict'

const React = require('react')
const { ItemIterable } = require('./iterable')
const { ItemTableCell } = require('./table-cell')
const { meta } = require('../../common/os')
const { get, pick } = require('../../common/util')
const { DC } = require('../../constants')
const cx = require('classnames')
const { arrayOf, object } = require('prop-types')

const CellProps = Object.keys(ItemTableCell.propTypes)

class ItemTableRow extends ItemIterable {

  isMainCell(id) {
    return DC.title === id
  }

  isEditing = (id) => {
    return get(this.props.edit, [this.props.item.id]) === id
  }

  handleMouseDown = (event) => {
    if (!this.props.isSelected || meta(event)) {
      this.handleSelect(event)
    }
  }

  render() {
    const { columns, data, photos, tags, ...props } = this.props

    return this.connect(
      <tr
        className={cx(this.classes)}
        ref={this.setContainer}
        onMouseDown={this.handleMouseDown}
        onDoubleClick={this.handleOpen}
        onContextMenu={this.handleContextMenu}>{
          columns.map(({ property, width }) => {
            const isMainCell = this.isMainCell(property.id)
            return (
              <ItemTableCell {...pick(props, CellProps)}
                key={property.id}
                property={property}
                data={data}
                width={width}
                tags={isMainCell ? tags : null}
                photos={isMainCell ? photos : null}
                isEditing={this.isEditing(property.id)}
                isMainCell={isMainCell}/>
            )
          })
      }</tr>
    )
  }

  static propTypes = {
    ...ItemIterable.propTypes,
    edit: object,
    data: object.isRequired,
    columns: arrayOf(object).isRequired
  }

  static defaultProps = {
    ...ItemIterable.defaultProps,
    data: {}
  }
}


module.exports = {
  ItemTableRow: ItemTableRow.wrap()
}
