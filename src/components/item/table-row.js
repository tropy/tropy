'use strict'

const React = require('react')
const { PropTypes } = React
const { ItemIterable } = require('./iterable')
const { ItemTableCell } = require('./table-cell')
const { meta } = require('../../common/os')
const { DC } = require('../../constants/properties')
const cn = require('classnames')
const { arrayOf, func, object } = PropTypes


class ItemTableRow extends ItemIterable {

  isEditing = (uri) => {
    const { editing, item } = this.props
    return editing.column && editing.column[item.id] === uri
  }

  handleClick = (event, cancel) => {
    if (!this.props.isSelected || meta(event)) {
      cancel()
      this.handleSelect(event)
    }
  }

  handleSingleClick = (event, ...args) => {
    const { isDragging, isSelected, onColumnEdit } = this.props

    if (isDragging) return

    if (isSelected) {
      onColumnEdit(...args)
    } else {
      this.handleSelect(event)
    }
  }

  render() {
    const { columns, isSelected, ...props } = this.props

    return this.connect(
      <tr
        className={cn(this.classes)}
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
              width={width}
              onClick={this.handleClick}
              onSingleClick={this.handleSingleClick}
              onDoubleClick={this.handleOpen}/>
          ))
        }
      </tr>
    )
  }

  static propTypes = {
    ...ItemIterable.propTypes,

    editing: object,
    columns: arrayOf(object),

    onColumnEdit: func.isRequired,
    onCancel: func.isRequired,
    onMetadataSave: func.isRequired
  }
}


module.exports = {
  ItemTableRow: ItemTableRow.wrap()
}
