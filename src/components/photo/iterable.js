'use strict'

const React = require('react')
const { Thumbnail } = require('./thumbnail')
const { DND, DragSource, DropTarget, getEmptyImage } = require('../dnd')
const { bounds } = require('../../dom')
const { pure } = require('../util')
const { pick } = require('../../common/util')

const {
  arrayOf, bool, func, number, string, object, shape
} = require('prop-types')


class PhotoIterable extends React.PureComponent {
  state = {
    offset: null
  }

  componentDidMount() {
    this.props.connectDragPreview(getEmptyImage())
  }

  componentDidUpdate(props) {
    if (this.props.isSelected && !props.isSelected) {
      this.container.scrollIntoViewIfNeeded()
    }
  }

  get classes() {
    return ['photo', {
      'drop-target': this.props.isSortable,
      'over': this.props.isOver,
      'dragging': this.props.isDragging,
      'last': this.props.isLast,
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

  handleContextMenu = (event) => {
    this.select()
    this.props.onContextMenu(
      event,
      this.props.isDisabled ? 'photo-read-only' : 'photo',
      pick(this.props.photo, ['id', 'item', 'path', 'protocol']))
  }

  setContainer = (container) => {
    this.container = container
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
        adj: getAdjacent(photo).map(p => p && p.id)
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
      const { top, left, width, height } = bounds(component.container)
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
    isLast: bool,
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

module.exports = {
  PhotoIterable
}
