import React from 'react'
import { Thumbnail } from './thumbnail'
import { DND, DragSource, DropTarget, getEmptyImage } from '../dnd'
import { bounds } from '../../dom'
import { pure } from '../util'
import { pick } from '../../common/util'

import {
  arrayOf, bool, func, number, string, object, shape
} from 'prop-types'


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

  select = (event) => {
    this.props.onSelect(this.props.photo, event)
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
        cache={this.props.cache}
        size={this.props.size}
        onError={this.props.onError}/>
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


  static propTypes = {
    cache: string.isRequired,
    isDisabled: bool,
    isDragging: bool,
    isExpandable: bool,
    isExpanded: bool,
    isItemOpen: bool,
    isOver: bool,
    isSelected: bool,
    isSortable: bool,
    isVertical: bool,
    photo: shape({
      id: number.isRequired,
      selections: arrayOf(number),
      data: object
    }).isRequired,
    selection: number,
    size: number.isRequired,
    connectDragSource: func.isRequired,
    connectDropTarget: func.isRequired,
    connectDragPreview: func.isRequired,
    getAdjacent: func.isRequired,
    onConsolidate: func.isRequired,
    onContextMenu: func.isRequired,
    onContract: func.isRequired,
    onDropPhoto: func.isRequired,
    onError: func.isRequired,
    onExpand: func.isRequired,
    onItemOpen: func.isRequired,
    onSelect: func.isRequired
  }

  static defaultProps = {
    size: 48
  }
}
