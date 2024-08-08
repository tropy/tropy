import React from 'react'
import { Button } from '../button.js'
import { Editable } from '../editable.js'
import { Collapse } from '../fx.js'
import { IconFolder, IconGhost, IconTriangle } from '../icons.js'
import { bounds } from '../../dom.js'
import { ListTree } from './tree.js'
import cx from 'classnames'
import { noop, restrict } from '../../common/util.js'

import {
  DND,
  DragSource,
  DropTarget,
  getEmptyImage,
  getDroppedFiles,
  hasPhotoFiles
} from '../dnd.js'

import { LIST, SASS } from '../../constants/index.js'
const { INDENT, PADDING } = SASS.LIST


const NewListNode = React.forwardRef(({
  name = '',
  onCancel,
  onSave,
  parent = LIST.ROOT
}, ref) => (
  <li className="list-node" ref={ref}>
    <div className="list new-list list-node-container">
      <div className="icon-truncate">
        <IconFolder/>
      </div>
      <div className="name">
        <Editable
          isActive
          isRequired
          resize
          value={name}
          onCancel={onCancel}
          onChange={(newName) =>
            onSave({ parent, name: newName })}/>
      </div>
    </div>
  </li>
))

class ListNode extends React.PureComponent {
  state = {
    depth: null,
    offset: null
  }

  constructor(props) {
    super(props)

    this.isHalloween = props.isHalloween &&
      Math.round(Math.random() * props.depth) > (props.depth * 0.666)
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
    let { props, state } = this
    return (!this.isOver || state.offset == null) ? null :
        (state.offset < 1) ? 'before' :
            (props.isLast && !props.isExpanded && state.depth < props.depth) ?
                ['after', `depth-${props.depth - this.getDropDepth()}`] : 'after'
  }

  get icon() {
    return (this.props.depth > 0 && this.isHalloween) ?
        <IconGhost/> : <IconFolder/>
  }

  get isOver() {
    return this.props.isOver && this.props.canDrop
  }

  get isDragSource() {
    return !(
      this.props.isReadOnly ||
      this.props.isEditing ||
      this.props.isDraggingParent
    )
  }

  get isDropTarget() {
    return !(
      this.props.isReadOnly ||
      this.props.isDragging ||
      this.props.isDraggingParent
    )
  }

  getDropDepth(depth = this.state.depth) {
    return restrict(depth, this.props.minDropDepth, this.props.depth)
  }

  getDropOutsidePosition(depth = 1, other) {
    let { lists, list } = this.props
    let prev

    for (; depth > 0 && list.parent != null; --depth) {
      prev = list.id
      list = lists[list.parent]
      if (list.children.at(-1) !== prev) break
    }

    let idx = (prev == null) ?
      list.children.length :
      list.children.indexOf(prev) + 1

    let pos = list.children.indexOf(other.id)
    if (pos >= 0 && pos < idx) idx--

    return { parent: list.id, idx }
  }

  getDropPosition(other) {
    let { offset } = this.state
    let { list, isExpanded, isLast, position } = this.props

    if (offset == null || (offset === 1 && isExpanded)) {
      return {
        parent: list.id,
        idx: 0
      }
    }

    let depth = this.getDropDepth()
    if (isLast && offset === 1 && depth < this.props.depth) {
      return this.getDropOutsidePosition(1 + this.props.depth - depth, other)
    }

    return {
      parent: list.parent,
      idx: (list.parent !== other.parent || position < other.idx) ?
        position + offset :
        position - 1 + offset
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

      this.props.onContextMenu(event, 'list', {
        id: this.props.list.id
      })
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

  renderNodeContainer() {
    return this.connect(
      <div
        className={cx('list-node-container', this.direction, {
          over: this.isOver
        })}
        ref={this.setContainer}
        onContextMenu={this.handleContextMenu}
        onClick={this.handleClick}>
        {this.props.isExpandable && (
          <Button
            icon={<IconTriangle/>}
            noFocus
            onClick={this.handleExpandButtonClick}/>
        )}
        <div className="icon-truncate">{this.icon}</div>
        <div className="name">
          <Editable
            isActive={this.props.isEditing}
            isDisabled={this.props.isReadOnly || this.props.isDragging}
            isRequired
            resize
            value={this.props.list.name}
            onCancel={this.props.onEditCancel}
            onChange={this.handleChange}/>
        </div>
      </div>
    )
  }

  render() {
    return (
      <li className={cx(...this.classes)}>
        {this.renderNodeContainer()}
        <Collapse in={this.props.isExpanded}>
          <ListTree
            {...this.props}
            depth={1 + this.props.depth}
            minDropDepth={this.props.isLast ?
              this.props.minDropDepth : this.props.depth}
            isDraggingParent={
              this.props.isDraggingParent || this.props.isDragging
            }
            parent={this.props.list}/>
        </Collapse>
      </li>
    )
  }

  static defaultProps = {
    depth: 0,
    onClick: noop,
    position: 0,
    isHalloween: ((d) => d.getMonth() === 9 && d.getDate() === 31)(new Date())
  }
}

const DragSourceSpec = {
  beginDrag({ list, depth, position }) {
    return {
      ...list,
      idx: position,
      padding: PADDING + INDENT * depth,
      position: 'relative'
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
      default:
        if (node.state.offset != null) {
          node.setState({ detph: null, offset: null })
        }
    }
  },

  canDrop(props, monitor) {
    switch (monitor.getItemType()) {
      case DND.FILE:
        return hasPhotoFiles(monitor.getItem())
      case DND.LIST:
        return !(props.isDragging || props.isDraggingParent)
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
          let { parent, idx } = node.getDropPosition(item)
          props.onMove({ id: item.id, parent }, { idx })
          break
        }
        case DND.ITEMS:
          props.onDropItems({
            list: list.id,
            items: item.items
          })
          break
        case DND.FILE:
        case DND.URL: {
          let files = getDroppedFiles(item)
          if (files) {
            props.onDropFiles({ list: list.id, ...files })
          }
          return files
        }
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


const ListNodeContainer =
  DragSource(DND.LIST, DragSourceSpec, DragSourceCollect)(
    DropTarget([
      DND.LIST, DND.ITEMS, DND.FILE, DND.URL],
    DropTargetSpec,
    DropTargetCollect)(ListNode))

export {
  ListNodeContainer as ListNode,
  NewListNode
}

