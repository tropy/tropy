'use strict'

const React = require('react')
const { Component, PropTypes } = React
const { connect } = require('react-redux')
const { TableCell } = require('./table-cell')
const { get } = require('dot-prop')
const { meta } = require('../../common/os')
const { DC } = require('../../constants/properties')
const act = require('../../actions')
const cn = require('classnames')

class TableRow extends Component {

  get isDisabled() {
    return !!this.props.item.deleted
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
      editing, columns, isSelected, onColumnChange, onColumnEdit, ...props
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
              isEditing={property.uri === editing}
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
      photos: PropTypes.arrayOf(PropTypes.number),
      deleted: PropTypes.bool
    }).isRequired,

    data: PropTypes.object,
    editing: PropTypes.string,
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
  TableRow: connect(
    (state, { item }) => ({
      data: state.metadata[item.id] || {},
      editing: get(state, `ui.edit.column.${item.id}`)
    })
  )(TableRow)
}
