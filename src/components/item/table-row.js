'use strict'

const React = require('react')
const { Component, PropTypes } = React
const { TableCell } = require('./table-cell')
const { meta } = require('../../common/os')
const { DC } = require('../../constants/properties')
const cn = require('classnames')

class TableRow extends Component {

  get isDisabled() {
    return !!this.props.item.deleted
  }

  isEditing = (uri) => {
    const { editing, item } = this.props
    return editing.column && editing.column[item.id] === uri
  }

  handleClick = (event) => {
    const { item, isSelected, onSelect } = this.props

    if (!isSelected || meta(event)) {
      event.stopPropagation() // Swallow single click!
    }

    onSelect(item, event)
  }

  handleDoubleClick = () => {
    const { item, onOpen } = this.props
    onOpen({ id: item.id, photos: item.photos })
  }

  handleContextMenu = (event) => {
    this.props.onContextMenu(this.props.item, event)
  }

  render() {
    const {
      columns, isSelected, onColumnChange, onColumnEdit, ...props
    } = this.props

    const { isDisabled } = this

    delete props.onSelect
    delete props.onContextMenu

    return (
      <tr
        className={cn({ item: true, active: isSelected })}
        onContextMenu={this.handleContextMenu}>
        {
          columns.map(({ property, width }) => (
            <TableCell {...props}
              key={property.uri}
              isEditing={this.isEditing(property.uri)}
              isDisabled={isDisabled}
              isSelected={isSelected}
              hasCoverImage={property.uri === DC.TITLE}
              property={property}
              width={width}
              onChange={onColumnChange}
              onClick={this.handleClick}
              onSingleClick={onColumnEdit}
              onDoubleClick={this.handleDoubleClick}/>
          ))
        }
      </tr>
    )
  }

  static propTypes = {
    item: PropTypes.shape({
      id: PropTypes.number.isRequired,
      data: PropTypes.object,
      deleted: PropTypes.bool,
      photos: PropTypes.arrayOf(PropTypes.number)
    }).isRequired,

    editing: PropTypes.object,
    cache: PropTypes.string.isRequired,
    columns: PropTypes.arrayOf(PropTypes.object),

    isSelected: PropTypes.bool,

    onSelect: PropTypes.func.isRequired,
    onContextMenu: PropTypes.func,
    onColumnChange: PropTypes.func,
    onColumnEdit: PropTypes.func,
    onCancel: PropTypes.func,
    onOpen: PropTypes.func
  }
}


module.exports = {
  TableRow
}
