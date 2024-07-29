import React from 'react'
import { Thumbnail } from './thumbnail.js'
import { DND, DragSource, DropTarget, getEmptyImage } from '../dnd.js'
import { bounds } from '../../dom.js'
import { pure } from '../util.js'
import { pick } from '../../common/util.js'


export class PhotoIterable extends React.PureComponent {
  container = React.createRef()

  state = {
    offset: null
  }

  componentDidMount() {
    this.props.connectDragPreview(getEmptyImage())
  }

  componentDidUpdate(props) {
    if (this.props.isSelected && !props.isSelected) {
      this.container.current.scrollIntoViewIfNeeded()
    }
  }

  get classes() {
    return ['photo', {
      'drop-target': this.props.isSortable,
      'over': this.props.isOver,
      'dragging': this.props.isDragging,
      'expanded': this.props.isExpanded,
      'expandable': this.props.isExpandable,
      [this.direction]: this.props.isOver && this.state.offset != null
    }]
  }

  get direction() {
    return this.state.offset ? 'after' : 'before'
  }

  get isActive() {
    return this.props.isSelected && this.props.selection == null
  }

  get isDraggable() {
    return !this.props.isDisabled
  }

  select = () => {
    if (!this.isActive) {
      this.props.onSelect(this.props.photo)
    }
  }

  contract() {
    this.props.onContract(this.props.photo)
  }

  expand() {
    this.props.onExpand(this.props.photo)
  }

  handleConsolidate = (event) => {
    event?.stopPropagation()

    this.props.onConsolidate([this.props.photo.id], {
      force: true, prompt: true
    })
  }

  handleContextMenu = (event) => {
    this.select()
    this.props.onContextMenu(
      event,
      this.props.isDisabled ? 'photo-read-only' : 'photo',
      pick(this.props.photo, ['id', 'item', 'path', 'protocol']))
  }

  connect(element) {
    if (this.props.isSortable)
      element = this.props.connectDropTarget(element)
    if (this.isDraggable)
      element = this.props.connectDragSource(element)
    return element
  }

  renderThumbnail(props) {
    return (
      <Thumbnail
        {...props}
        {...pick(this.props.photo, Thumbnail.keys)}
        size={this.props.size}/>
    )
  }


  static DragSourceSpec = {
    beginDrag({ photo, getAdjacent }) {
      return {
        ...pick(photo, Thumbnail.keys),
        id: photo.id,
        item: photo.item,
        adj: getAdjacent(photo)
      }
    },

    canDrag({ isDisabled }) {
      return !isDisabled
    },

    endDrag({ onDropPhoto }, monitor) {
      const result = monitor.didDrop() && monitor.getDropResult()

      if (!result) return
      if (result.id === result.to) return
      if (result.offset == null) return

      onDropPhoto(result)
    }
  }

  static DragSourceCollect = (connect, monitor) => ({
    connectDragSource: connect.dragSource(),
    connectDragPreview: connect.dragPreview(),
    isDragging: monitor.isDragging()
  })


  static DropTargetSpec = {
    hover({ photo, isVertical }, monitor, component) {
      const { id, adj } = monitor.getItem()
      const { top, left, width, height } = bounds(component.container.current)
      const { x, y } = monitor.getClientOffset()

      let offset = null

      if (photo.id !== id) {
        offset = Math.round(
          isVertical ? ((y - top) / height) : ((x - left) / width)
        )

        if (adj[1 - offset] === photo.id) {
          offset = null
        }
      }

      component.setState({ offset })
    },

    drop({ photo }, monitor, component) {
      try {
        return {
          id: monitor.getItem().id,
          to: photo.id,
          offset: component.state.offset
        }

      } finally {
        component.setState({ offset: null })
      }
    }
  }

  static DropTargetCollect = (connect, monitor) => ({
    connectDropTarget: connect.dropTarget(),
    isOver: monitor.isOver()
  })

  static wrap() {
    return pure(DragSource(
      DND.PHOTO, this.DragSourceSpec, this.DragSourceCollect
    )(DropTarget(
      DND.PHOTO, this.DropTargetSpec, this.DropTargetCollect
    )(this)))
  }

  static defaultProps = {
    size: 48
  }
}
