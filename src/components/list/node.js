'use strict'

const React = require('react')
const { Button } = require('../button')
const { Editable } = require('../editable')
const { IconFolder, IconChevron9 } = require('../icons')
const { DragSource, DropTarget } = require('react-dnd')
const { NativeTypes, getEmptyImage } = require('react-dnd-electron-backend')
const { DND } = require('../../constants')
const { bounds } = require('../../dom')
const { isValidImage } = require('../../image')
const lazy = require('./tree')
const cx = require('classnames')
const { noop } = require('../../common/util')

const {
  arrayOf, bool, func, number, object, shape, string
} = require('prop-types')


class NewListNode extends React.Component {
  handleChange = (name) => {
    this.props.onSave({ parent: this.props.parent, name })
  }

  render() {
    return (
      <li className="list-node">
        <div className="list new-list">
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


class ListNode extends React.PureComponent {
  componentDidMount() {
    this.props.dp(getEmptyImage())
  }

  get classes() {
    return ['list-node', {
      active: this.props.isSelected,
      holding: this.props.isHolding,
      expandable: this.isExpandable,
      expanded: this.props.isExpanded
    }]
  }

  get isOver() {
    return this.props.isOver &&
      this.props.canDrop &&
      this.props.dtType !== DND.LIST
  }

  get isExpandable() {
    return this.props.list.children.length > 0
  }

  get isDraggable() {
    return !this.props.isEditing
  }

  handleChange = (name) => {
    this.props.onSave({ id: this.props.list.id, name })
  }

  handleClick = () => {
    if (!this.props.isEditing) {
      this.props.onClick(this.props.list)
    }
  }

  handleContextMenu = (event) => {
    if (!this.props.isEditing) {
      if (!this.props.isSelected) {
        this.props.onClick(this.props.list)
      }

      this.props.onContextMenu(event, 'list', this.props.list.id)
    }
  }

  handleTwistyButtonClick = () => {
    if (this.props.isExpanded) this.collapse()
    else this.expand()
  }

  setContainer = (container) => {
    this.container = container
  }

  connect(element) {
    if (this.isDraggable) element = this.props.ds(element)
    return this.props.dt(element)
  }

  collapse = () => {
    this.props.onCollapse(this.props.list.id)
  }

  expand = () => {
    this.props.onExpand(this.props.list.id)
  }

  renderNode() {
    return this.connect(
      <div
        className={cx('drop-target', {
          dragging: this.props.isDragging,
          over: this.isOver
        })}
        ref={this.setContainer}
        onContextMenu={this.handleContextMenu}
        onClick={this.handleClick}>
        {this.isExpandable &&
          <ListExpandButton onClick={
              this.props.isExpanded ? this.collapse : this.expand
          }/>}
        <IconFolder/>
        <div className="name">
          <Editable
            isActive={this.props.isEditing}
            isRequired
            resize
            value={this.props.list.name}
            onCancel={this.props.onEditCancel}
            onChange={this.handleChange}/>
        </div>
      </div>
    )
  }

  renderSubTree(props = this.props) {
    return props.isExpanded && (
      <lazy.ListTree {...props} parent={props.list}/>
    )
  }

  render() {
    return (
      <li className={cx(...this.classes)}>
        {this.renderNode()}
        {this.renderSubTree()}
      </li>
    )
  }

  static propTypes = {
    canDrop: bool,
    expand: object.isRequired,
    isDragging: bool,
    isEditing: bool,
    isExpanded: bool,
    isHolding: bool,
    isOver: bool,
    isSelected: bool,
    list: shape({
      id: number.isRequired,
      parent: number.isRequired,
      name: string.isRequired,
      children: arrayOf(number).isRequired
    }).isRequired,

    ds: func.isRequired,
    dp: func.isRequired,
    dt: func.isRequired,
    dtType: string,
    onCollapse: func.isRequired,
    onExpand: func.isRequired,
    onSortPreview: func,
    onSortReset: func,
  }

  static defaultProps = {
    onClick: noop
  }
}

const ListExpandButton = (props) =>
  <Button {...props} icon={<IconChevron9/>}/>


const DragSourceSpec = {
  beginDrag({ list }) {
    return { id: list.id, name: list.name }
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
  dp: connect.dragPreview(),
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
