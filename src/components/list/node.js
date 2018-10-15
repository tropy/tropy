'use strict'

const React = require('react')
const { Editable } = require('../editable')
const { IconFolder } = require('../icons')
const { DragSource, DropTarget } = require('react-dnd')
const { NativeTypes } = require('react-dnd-electron-backend')
const { DND } = require('../../constants')
const { bounds } = require('../../dom')
const { isValidImage } = require('../../image')
const lazy = require('./tree')
const cx = require('classnames')
const { has, noop, pick } = require('../../common/util')
const { arrayOf, bool, func, number, shape, string } = require('prop-types')


class NewListNode extends React.Component {
  handleChange = (name) => {
    this.props.onSave({ parent: this.props.parent, name })
  }

  render() {
    return (
      <li className="list new-list">
        <IconFolder/>
        <div className="name">
          <Editable
            isActive
            isRequired
            resize
            value={this.props.name}
            onCancel={this.props.onCancel}
            onChange={this.handleChange}/>
        </div>
      </li>
    )
  }

  static propTypes = {
    parent: number.isRequired,
    name: string.isRequired,
    onCancel: func.isRequired,
    onSave: func.isRequired
  }

  static defaultProps = {
    name: ''
  }
}


class ListNode extends React.Component {
  get classes() {
    return ['list', {
      'active': this.props.isSelected,
      'expandable': this.hasChildren,
      'expanded': this.props.isExpanded,
      'dragging': this.props.isDragging,
      'drop-target': this.props.isSortable,
      'holding': this.props.isHolding,
      'over': this.isOver
    }]
  }

  get isOver() {
    return this.props.isOver &&
      this.props.canDrop &&
      this.props.dtType !== DND.LIST
  }

  get hasChildren() {
    return has(this.props.list, ['children'])
  }

  get isDraggable() {
    return !this.props.isEditing
  }

  getListTreeProps(props = this.props) {
    return pick(props, Object.keys(lazy.ListTree.propTypes))
  }

  handleChange = (name) => {
    this.props.onListSave({ id: this.props.list.id, name })
  }

  handleClick = (event) => {
    event.stopPropagation()
    this.props.onClick(this.props.list)
  }

  handleContextMenu = (event) => {
    if (!this.props.isSelected) {
      this.props.onClick(this.props.list)
    }

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
    let { list, isEditing, onEditCancel } = this.props

    return this.connect(
      <li
        className={cx(this.classes)}
        ref={this.setContainer}
        onContextMenu={isEditing ? null : this.handleContextMenu}
        onClick={isEditing ? null : this.handleClick}>
        <IconFolder/>
        <div className="name">
          <Editable
            value={list.name}
            isRequired
            resize
            isActive={isEditing}
            onCancel={onEditCancel}
            onChange={this.handleChange}/>
        </div>
        {this.hasChildren &&
          <lazy.ListTree {...this.getListTreeProps()} parent={list}/>}
      </li>
    )
  }

  static propTypes = {
    canDrop: bool,
    isDragging: bool,
    isEditing: bool,
    isExpanded: bool,
    isHolding: bool,
    isOver: bool,
    isSelected: bool,
    isSortable: bool,
    list: shape({
      id: number,
      parent: number,
      name: string,
      children: arrayOf(number)
    }),

    ds: func.isRequired,
    dt: func.isRequired,
    dtType: string,
    onSortPreview: func,
    onSortReset: func,
  }

  static defaultProps = {
    onClick: noop
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

  canDrop(_, monitor) {
    const type = monitor.getItemType()
    const item = monitor.getItem()

    switch (type) {
      case NativeTypes.FILE:
        return !!item.types.find(t => isValidImage({ type: t }))

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


module.exports.NewListNode = NewListNode

module.exports.ListNode =
  DragSource(DND.LIST, DragSourceSpec, DragSourceCollect)(
    DropTarget([
      DND.LIST, DND.ITEMS, NativeTypes.FILE],
        DropTargetSpec,
        DropTargetCollect)(ListNode))
