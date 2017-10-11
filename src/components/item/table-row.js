'use strict'

const React = require('react')
const { ItemIterable } = require('./iterable')
const { ItemTableCell } = require('./table-cell')
const { get, pick } = require('../../common/util')
const { DC } = require('../../constants')
const cx = require('classnames')
const { arrayOf, object } = require('prop-types')

const CellProps = Object.keys(ItemTableCell.propTypes)

class ItemTableRow extends ItemIterable {

  isMainColumn(id) {
    return DC.title === id
  }

  isEditing = (id) => {
    return get(this.props.edit, [this.props.item.id]) === id
  }

  render() {
    const { columns, data, photos, tags, ...props } = this.props

    return this.connect(
      <tr
        className={cx(this.classes)}
        ref={this.setContainer}
        onMouseDown={this.handleSelect}
        onDoubleClick={this.handleOpen}
        onContextMenu={this.handleContextMenu}>{
          columns.map(({ property, width }) => {
            const isMainColumn = this.isMainColumn(property.id)
            return (
              <ItemTableCell {...pick(props, CellProps)}
                key={property.id}
                property={property}
                data={data}
                width={width}
                tags={isMainColumn ? tags : null}
                photos={isMainColumn ? photos : null}
                isEditing={this.isEditing(property.id)}
                isMainColumn={isMainColumn}
                getSelection={this.props.getSelection}/>
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
