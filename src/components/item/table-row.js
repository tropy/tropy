'use strict'

const React = require('react')
const { Component, PropTypes } = React
const { getEmptyImage } = require('react-dnd-html5-backend')
const { ItemTableCell } = require('./table-cell')
const { ItemDragSource } = require('./drag-source')
const { ItemDropTarget } = require('./drop-target')
const { meta } = require('../../common/os')
const { DC } = require('../../constants/properties')
const cn = require('classnames')


class ItemTableRow extends Component {

  componentDidMount() {
    this.props.dp(getEmptyImage())
  }

  get isDisabled() {
    return !!this.props.item.deleted
  }


  get classes() {
    return {
      item: true,
      active: this.props.isSelected,
      dragging: this.props.isDragging,
      over: this.props.isOver
    }
  }

  isEditing = (uri) => {
    const { editing, item } = this.props
    return editing.column && editing.column[item.id] === uri
  }

  handleClick = (event) => {
    const { item, isSelected, onSelect } = this.props

    if (!isSelected || meta(event)) {
      event.stopPropagation() // Swallow single click!
      onSelect(item, event)
    }
  }

  handleSingleClick = (event, ...args) => {
    const { item, isDragging, isSelected, onSelect, onColumnEdit } = this.props

    if (isDragging) return

    if (isSelected) {
      onColumnEdit(...args)
    } else {
      onSelect(item, event)
    }
  }

  handleDoubleClick = () => {
    const { item, onOpen } = this.props
    onOpen({ id: item.id, photos: item.photos })
  }

  handleContextMenu = (event) => {
    const { item, isSelected, onContextMenu, onSelect } = this.props

    if (!isSelected) {
      onSelect(item, event)
    }

    // TODO needs updated selection
    onContextMenu(item, event)
  }

  render() {
    const {
      ds, dt, columns, isSelected, ...props
    } = this.props

    delete props.dp
    delete props.onSelect
    delete props.onContextMenu
    delete props.onColumnEdit

    return ds(dt(
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
              onDoubleClick={this.handleDoubleClick}/>
          ))
        }
      </tr>
    ))
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
    selection: PropTypes.arrayOf(PropTypes.number),

    isSelected: PropTypes.bool,
    isDragging: PropTypes.bool,
    isOver: PropTypes.bool,

    ds: PropTypes.func.isRequired,
    dp: PropTypes.func.isRequired,
    dt: PropTypes.func.isRequired,

    onSelect: PropTypes.func.isRequired,
    onContextMenu: PropTypes.func,
    onColumnEdit: PropTypes.func,
    onCancel: PropTypes.func,
    onDropPhotos: PropTypes.func,
    onMetadataSave: PropTypes.func,
    onOpen: PropTypes.func
  }
}


module.exports = {
  ItemTableRow: ItemDragSource()(ItemDropTarget()(ItemTableRow))
}
