'use strict'

const React = require('react')
const PropTypes = require('prop-types')
const { ItemIterable } = require('./iterable')
const { ItemTableCell } = require('./table-cell')
const { meta } = require('../../common/os')
const { get, pick } = require('../../common/util')
const { DC } = require('../../constants/properties')
const cx = require('classnames')
const { arrayOf, object } = PropTypes

const CellProps = Object.keys(ItemTableCell.propTypes)

class ItemTableRow extends ItemIterable {

  isEditing = (uri) => {
    return get(this.props.edit, [this.props.item.id]) === uri
  }

  handleMouseDown = (event) => {
    if (!this.props.isSelected || meta(event)) {
      this.handleSelect(event)
    }
  }

  render() {
    const { columns, data, ...props } = this.props

    return this.connect(
      <tr
        className={cx(this.classes)}
        ref={this.setContainer}
        onMouseDown={this.handleMouseDown}
        onDoubleClick={this.handleOpen}
        onContextMenu={this.handleContextMenu}>{
          columns.map(({ property, width }) =>
            <ItemTableCell {...pick(props, CellProps)}
              key={property.uri}
              property={property}
              data={data}
              width={width}
              isEditing={this.isEditing(property.uri)}
              hasCoverImage={property.uri === DC.TITLE}/>)
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
