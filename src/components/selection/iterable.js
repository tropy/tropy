import React from 'react'
import { DND, DragSource, DropTarget, getEmptyImage } from '../dnd'
import { Thumbnail } from '../photo/thumbnail'
import { bool, func, number, shape, string } from 'prop-types'
import { bounds } from '../../dom'
import { pick } from '../../common/util'
import { pure } from '../util'


export class SelectionIterable extends React.PureComponent {
  container = React.createRef()

  state = {
    offset: null
  }

  componentDidMount() {
    this.props.dragPreview(getEmptyImage())
  }

  componentDidUpdate({ isActive }) {
    if (this.props.isActive && !isActive) {
      this.container.current.scrollIntoViewIfNeeded()
    }
  }

  get classes() {
    return {
      'active': this.props.isActive,
      'dragging': this.props.isDragging,
      'drop-target': this.props.isSortable,
      'last': this.props.isLast,
      'over': this.props.isOver,
      'selection': true,
      [this.direction]: this.props.isOver && this.state.offset != null
    }
  }

  get direction() {
    return this.state.offset ? 'after' : 'before'
  }

  get isDraggable() {
    return !this.props.isDisabled
  }


  select = () => {
    this.props.onSelect(this.props.selection)
  }

  open = () => {
    this.props.onItemOpen(this.props.selection)
  }

  handleContextMenu = (event) => {
    this.select()
    this.props.onContextMenu(
      event,
      this.props.isDisabled ? 'selection-read-only' : 'selection',
      pick(this.props.photo, ['id', 'item', 'path', 'protocol'], {
        selection: this.props.selection.id
      }))
  }

  connect(element) {
    if (this.props.isSortable) element = this.props.dropTarget(element)
    if (this.isDraggable) element = this.props.dragSource(element)

    return element
  }

  renderThumbnail(props) {
    return (
      <Thumbnail
        {...props}
        {...pick(this.props.selection, Thumbnail.keys)}
        cache={this.props.cache}
        color={this.props.photo.color}
        mimetype={this.props.photo.mimetype}
        orientation={this.props.photo.orientation}
        size={this.props.size}
        onError={this.props.onError}/>
    )
  }

  static propTypes = {
    dragPreview: func,
    dragSource: func,
    dropTarget: func,
    getAdjacent: func.isRequired,
    isActive: bool.isRequired,
    isDisabled: bool.isRequired,
    isDragging: bool,
    isLast: bool.isRequired,
    isItemOpen: bool,
    isOver: bool,
    isSortable: bool.isRequired,
    isVertical: bool.isRequired,
    cache: string.isRequired,
    photo: shape({
      id: number.isRequired,
      orientation: number.isRequired
    }).isRequired,
    selection: shape({
      id: number.isRequired,
      angle: number,
      mirror: bool
    }).isRequired,
    size: number.isRequired,
    onContextMenu: func.isRequired,
    onDropSelection: func.isRequired,
    onError: func.isRequired,
    onItemOpen: func.isRequired,
    onSelect: func.isRequired
  }

  static defaultProps = {
    size: 48
  }

  static withDragAndDrop() {
    return pure(
      DragSource(DND.SELECTION, DragSourceSpec, DragSourceCollect)(
        DropTarget(DND.SELECTION, DropTargetSpec, DropTargetCollect)(this)))
  }
}

const DragSourceSpec = {
  beginDrag({ photo, selection, getAdjacent }) {
    return {
      ...pick(selection, Thumbnail.keys),
      id: selection.id,
      photo: selection.photo,
      color: photo.color,
      mimetype: photo.mimetype,
      orientation: photo.orientation,
      adj: getAdjacent(selection)
    }
  },

  endDrag({ onDropSelection }, monitor) {
    const result = monitor.didDrop() && monitor.getDropResult()

    if (!result) return
    if (result.id === result.to) return
    if (result.offset == null) return

    onDropSelection(result)
  }
}

const DragSourceCollect = (connect, monitor) => ({
  dragSource: connect.dragSource(),
  dragPreview: connect.dragPreview(),
  isDragging: monitor.isDragging()
})


const DropTargetSpec = {
  canDrop({ photo }, monitor) {
    const selection = monitor.getItem()
    return photo.id === selection.photo
  },

  hover({ selection, isVertical }, monitor, component) {
    const { id, adj } = monitor.getItem()
    // TODO call bounds only on enter!
    const { top, left, width, height } = bounds(component.container.current)
    const { x, y } = monitor.getClientOffset()

    let offset = null

    if (selection.id !== id) {
      offset = Math.round(
        isVertical ? ((y - top) / height) : ((x - left) / width)
      )

      if (adj[1 - offset] === selection.id) {
        offset = null
      }
    }

    component.setState({ offset })
  },

  drop({ selection }, monitor, component) {
    try {
      return {
        id: monitor.getItem().id,
        to: selection.id,
        offset: component.state.offset
      }

    } finally {
      component.setState({ offset: null })
    }
  }
}

const DropTargetCollect = (connect, monitor) => ({
  dropTarget: connect.dropTarget(),
  isOver: monitor.isOver()
})
