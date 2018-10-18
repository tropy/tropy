'use strict'

const React = require('react')
const { Button } = require('../button')
const { Editable } = require('../editable')
const { IconFolder, IconTriangle } = require('../icons')
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
        <div className="list new-list list-node-container">
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
  state = {
    offset: null
  }

  componentDidMount() {
    this.props.connectDragPreview(getEmptyImage())
  }

  get classes() {
    return ['list-node', {
      active: this.props.isSelected,
      dragging: this.props.isDragging,
      holding: this.props.isHolding,
      expandable: this.props.isExpandable,
      expanded: this.props.isExpanded
    }]
  }

  get direction() {
    return (!this.props.isOver || this.state.offset == null) ?  null :
      (this.state.offset > 0) ? 'after' : 'before'
  }

  get isOver() {
    return this.props.isOver && this.props.canDrop
  }

  get isDragSource() {
    return !this.props.isEditing
  }

  get isDropTarget() {
    return !(this.props.isDragging || this.props.isDraggingParent)
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

  setContainer = (container) => {
    this.container = container
  }

  connect(element) {
    if (this.isDragSource) {
      element = this.props.connectDragSource(element)
    }
    if (this.isDropTarget) {
      element = this.props.connectDropTarget(element)
    }
    return element
  }

  handleExpandButtonClick = (event) => {
    event.stopPropagation()
    if (this.props.isExpanded) this.collapse()
    else this.expand()

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
        className={cx('list-node-container', this.direction, {
          over: this.isOver
        })}
        ref={this.setContainer}
        onContextMenu={this.handleContextMenu}
        onClick={this.handleClick}>
        {this.props.isExpandable &&
          <ListExpandButton onClick={this.handleExpandButtonClick}/>}
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
      <lazy.ListTree {...props}
        isDraggingParent={props.isDraggingParent || props.isDragging}
        parent={props.list}/>
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
    isDraggingParent: bool,
    isEditing: bool,
    isExpandable: bool,
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

    connectDragSource: func.isRequired,
    connectDragPreview: func.isRequired,
    connectDropTarget: func.isRequired,
    onCollapse: func.isRequired,
    onExpand: func.isRequired,
    onMove: func.isRequired,
    position: number.isRequired
  }

  static defaultProps = {
    onClick: noop
  }
}

const ListExpandButton = (props) =>
  <Button {...props} icon={<IconTriangle/>}/>


const DragSourceSpec = {
  beginDrag({ list }) {
    return { ...list }
  }
}

const DragSourceCollect = (connect, monitor) => ({
  connectDragSource: connect.dragSource(),
  connectDragPreview: connect.dragPreview(),
  isDragging: monitor.isDragging()
})

const DropTargetSpec = {
  hover(props, monitor, node) {
    let type = monitor.getItemType()
    //let item = monitor.getItem()

    switch (type) {
      case DND.LIST: {
        let { top, height } = bounds(node.container)
        let { y } = monitor.getClientOffset()
        let offset = (y - top) / height

        node.setState({
          offset: offset < 0.33 ? 0 : offset > 0.67 ? 1 : null
        })
        break
      }
    }
  },

  canDrop(props, monitor) {
    let type = monitor.getItemType()
    let item = monitor.getItem()

    switch (type) {
      case NativeTypes.FILE:
        return !!item.types.find(t => isValidImage({ type: t }))
      default:
        return true
    }
  },

  drop({ list, ...props }, monitor, node) {
    try {
      let type = monitor.getItemType()
      let item = monitor.getItem()

      switch (type) {
        case DND.LIST: {
          let { offset } = node.state
          let into = (offset == null || offset === 1 && props.isExpanded)
          let meta = {
            idx: into ? 0 : props.position + offset
          }

          props.onMove({
            id: item.id,
            parent: into ? list.id : list.parent
          }, meta)
          break
        }
        case DND.ITEMS:
          props.onDropItems({
            list: list.id,
            items: item.items
          })
          break
        case NativeTypes.FILE:
          props.onDropFiles({
            list: list.id,
            files: item.files.filter(isValidImage).map(file => file.path)
          })
          break
      }
    } finally {
      node.setState({ offset: null })
    }
  }
}

const DropTargetCollect = (connect, monitor) => ({
  connectDropTarget: connect.dropTarget(),
  isOver: monitor.isOver(),
  canDrop: monitor.canDrop()
})


module.exports.NewListNode = NewListNode

module.exports.ListNode =
  DragSource(DND.LIST, DragSourceSpec, DragSourceCollect)(
    DropTarget([
      DND.LIST, DND.ITEMS, NativeTypes.FILE],
        DropTargetSpec,
        DropTargetCollect)(ListNode))
