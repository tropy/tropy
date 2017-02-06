'use strict'

const React = require('react')
const { PropTypes, PureComponent } = React
const { Editable } = require('../editable')
const { IconFolder } = require('../icons')
const { DragSource, DropTarget } = require('react-dnd')
const { NativeTypes } = require('react-dnd-electron-backend')
const { DND } = require('../../constants')
const { bounds } = require('../../dom')
const { isValidImage } = require('../../image')
const cn = require('classnames')


class ListNode extends PureComponent {

  get classes() {
    return {
      'list': true,
      'drop-target': this.props.isSortable,
      'active': this.props.isSelected,
      'context': this.props.isContext,
      'dragging': this.props.isDragging,
      'over': this.isOver
    }
  }

  get isOver() {
    return this.props.isOver && this.props.canDrop &&
      this.props.dtType !== DND.LIST
  }

  get isDraggable() {
    return !this.props.isEditing
  }

  handleChange = (name) => {
    const { list: { id, parent }, onSave } = this.props
    onSave(id ? { id, name } : { parent, name })
  }

  handleClick = () => {
    const { list, isSelected, onEdit, onSelect } = this.props

    if (isSelected) {
      onEdit({ list: { id: list.id } })
    } else {
      onSelect({ list: list.id })
    }
  }

  handleContextMenu = (event) => {
    this.props.onContextMenu(event, 'list', this.props.list.id)
  }

  setContainer = (container) => {
    this.container = container
  }

  connect(element) {
    if (this.props.isSortable) element = this.props.dt(element)
    if (this.isDraggable) element = this.props.ds(element)

    return element
  }


  render() {
    const { list, isEditing, onEditCancel } = this.props

    return this.connect(
      <li
        className={cn(this.classes)}
        ref={this.setContainer}
        onContextMenu={this.handleContextMenu}
        onClick={this.handleClick}>
        <IconFolder/>
        <div className="name">
          <Editable
            value={list.name}
            isRequired
            isEditing={isEditing}
            onCancel={onEditCancel}
            onChange={this.handleChange}/>
        </div>
      </li>
    )
  }


  static propTypes = {
    list: PropTypes.shape({
      id: PropTypes.number,
      parent: PropTypes.number,
      name: PropTypes.string
    }),

    isContext: PropTypes.bool,
    isSelected: PropTypes.bool,
    isEditing: PropTypes.bool,
    isSortable: PropTypes.bool,

    isDragging: PropTypes.bool,
    isOver: PropTypes.bool,
    canDrop: PropTypes.bool,

    ds: PropTypes.func.isRequired,
    dt: PropTypes.func.isRequired,
    dtType: PropTypes.string,

    onEdit: PropTypes.func,
    onEditCancel: PropTypes.func,
    onContextMenu: PropTypes.func.isRequired,
    onDropItems: PropTypes.func,
    onDropFiles: PropTypes.func,
    onSelect: PropTypes.func.isRequired,
    onSave: PropTypes.func,
    onSort: PropTypes.func.isRequired,
    onSortPreview: PropTypes.func.isRequired,
    onSortReset: PropTypes.func.isRequired
  }

}

const DragSourceSpec = {
  beginDrag({ list }) {
    return { id: list.id }
  },

  endDrag({ onSort, onSortReset }, monitor) {
    if (monitor.didDrop()) {
      onSort()
    } else {
      onSortReset()
    }
  }
}

const DragSourceCollect = (connect, monitor) => ({
  ds: connect.dragSource(),
  isDragging: monitor.isDragging()
})

const DropTargetSpec = {
  hover({ list, onSortPreview }, monitor, { container }) {
    const type = monitor.getItemType()
    const item = monitor.getItem()

    switch (type) {
      case DND.LIST:
        if (item.id === list.id) break

        var { top, height } = bounds(container)
        var offset = Math.round((monitor.getClientOffset().y - top) / height)

        onSortPreview(item.id, list.id, offset)
        break
    }
  },

  canDrop({ list }, monitor) {
    const type = monitor.getItemType()
    const item = monitor.getItem()

    switch (type) {
      case NativeTypes.FILE:
        return !!item.files.find(isValidImage)

      default:
        return true
    }
  },

  drop({ list, onDropItems, onDropFiles }, monitor) {
    const type = monitor.getItemType()
    const item = monitor.getItem()

    switch (type) {
      case DND.ITEMS:
        onDropItems({
          list: list.id, items: item.items
        })
        break

      case NativeTypes.FILE:
        onDropFiles({
          list: list.id,
          files: item.files.filter(isValidImage).map(file => file.path)
        })
        break
    }
  }
}

const DropTargetCollect = (connect, monitor) => ({
  dt: connect.dropTarget(),
  isOver: monitor.isOver(),
  canDrop: monitor.canDrop(),
  dtType: monitor.getItemType()
})


module.exports = {
  ListNode:
    DragSource(
      DND.LIST, DragSourceSpec, DragSourceCollect)(
        DropTarget(
          [DND.LIST, DND.ITEMS, NativeTypes.FILE],
          DropTargetSpec,
          DropTargetCollect)(ListNode))
}
