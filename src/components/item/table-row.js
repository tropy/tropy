'use strict'

const React = require('react')
const { PropTypes } = React
const { ItemIterable } = require('./iterable')
const { ItemTableCell } = require('./table-cell')
const { meta } = require('../../common/os')
const { DC } = require('../../constants/properties')
const cn = require('classnames')
const { arrayOf, object } = PropTypes


class ItemTableRow extends ItemIterable {

  isEditing = (uri) => {
    const { editing, item } = this.props
    return editing.column && editing.column[item.id] === uri
  }

  handleMouseDown = (event) => {
    if (!this.props.isSelected || meta(event)) {
      this.handleSelect(event)
    }
  }

  render() {
    const { columns, isSelected, ...props } = this.props

    return this.connect(
      <tr
        className={cn(this.classes)}
        onMouseDown={this.handleMouseDown}
        onDoubleClick={this.handleOpen}
        onContextMenu={this.handleContextMenu}>
        {
          columns.map(({ property, width }) => (
            <ItemTableCell {...props}
              key={property.uri}
              isEditing={this.isEditing(property.uri)}
              isDisabled={this.isDisabled}
              isSelected={isSelected}
              hasCoverImage={property.uri === DC.TITLE}
              property={property}
              width={width}/>
          ))
        }
      </tr>
    )
  }

  static propTypes = {
    ...ItemIterable.propTypes,
    editing: object,
    columns: arrayOf(object)
  }
}


module.exports = {
  ItemTableRow: ItemTableRow.wrap()
}
