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
const { noop, restrict } = require('../../common/util')

const {
  arrayOf, bool, func, number, object, shape, string
} = require('prop-types')

const PADDING = 16
const INDENT = 12

class NewListNode extends React.Component {
  handleChange = (name) => {
    this.props.onSave({ parent: this.props.parent, name })
  }

  render() {
    return (
      <li className="list-node">
        <div className="list new-list list-node-container">
          <div className="icon-truncate">
            <IconFolder/>
          </div>
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
    depth: null,
    offset: null
  }

  componentDidMount() {
    this.props.connectDragPreview(getEmptyImage())
  }

  get classes() {
    return ['list-node', {
      active: this.props.isSelected,
      dragging: this.props.isDragging,
      expandable: this.props.isExpandable,
      expanded: this.props.isExpanded,
      holding: this.props.isHolding
    }]
  }

  get direction() {
    return (!this.props.isOver || this.state.offset == null) ?  null :
      (this.state.offset < 1) ? 'before' :
      (this.props.isLast && this.state.depth < this.props.depth) ?
        ['after', 'depth-1'] : 'after'
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

  getDropPosition({ depth, offset } = this.state, props = this.props) {
    if (offset == null || offset === 1 && props.isExpanded) {
      return {
        parent: props.list.id,
        idx: 0
      }
    }

    if (props.isLast && offset === 1 && depth < props.depth) {
      return {
        parent: props.parent.parent,
        idx: props.parentPosition + 1

      }
    }

    return {
      parent: props.list.parent,
      idx: props.position + offset
    }
  }

  isChildNodeSelected() {
    let { list, lists, selection, isSelected } = this.props
    if (!selection || isSelected) return false
    let p = lists[selection].parent
    while (p && p !== list.id) p = lists[p].parent
    return p === list.id
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
    this.props.onCollapse(this.props.list.id, {
      select: this.isChildNodeSelected()
    })
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
          <Button
            icon={<IconTriangle/>}
            noFocus
            onClick={this.handleExpandButtonClick}/>}
        <div className="icon-truncate">
          <IconFolder/>
        </div>
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
        depth={1 + props.depth}
        isDraggingParent={props.isDraggingParent || props.isDragging}
        parent={props.list}
        parentPosition={props.position}/>
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
    depth: number.isRequired,
    expand: object.isRequired,
    isDragging: bool,
    isDraggingParent: bool,
    isEditing: bool,
    isExpandable: bool,
    isExpanded: bool,
    isHolding: bool,
    isLast: bool,
    isOver: bool,
    isSelected: bool,
    list: shape({
      id: number.isRequired,
      parent: number.isRequired,
      name: string.isRequired,
      children: arrayOf(number).isRequired
    }).isRequired,
    position: number.isRequired,
    parentPosition: number.isRequired,

    connectDragSource: func.isRequired,
    connectDragPreview: func.isRequired,
    connectDropTarget: func.isRequired,
    onCollapse: func.isRequired,
    onExpand: func.isRequired,
    onMove: func.isRequired
  }

  static defaultProps = {
    depth: 0,
    onClick: noop,
    position: 0,
    parentPosition: 0
  }
}

const DragSourceSpec = {
  beginDrag({ list, depth }, _, node) {
    return {
      ...list,
      padding: PADDING + INDENT * depth,
      bounds: bounds(
        node.getDecoratedComponentInstance().container
      )
    }
  }
}

const DragSourceCollect = (connect, monitor) => ({
  connectDragSource: connect.dragSource(),
  connectDragPreview: connect.dragPreview(),
  isDragging: monitor.isDragging()
})

const DropTargetSpec = {
  hover({ depth }, monitor, node) {
    let type = monitor.getItemType()
    //let item = monitor.getItem()

    switch (type) {
      case DND.LIST: {
        let { left, top, height } = bounds(node.container)
        let { x, y } = monitor.getClientOffset()
        let offset = (y - top) / height

        node.setState({
          depth: restrict(Math.round((x - left - PADDING) / INDENT), 0, depth),
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
          let { parent, idx } = node.getDropPosition()
          props.onMove({ id: item.id, parent }, { idx })
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
      node.setState({ detph: null, offset: null })
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
