'use strict'

const React = require('react')
const { PureComponent } = React
const { Thumbnail } = require('../photo/thumbnail')
const { DragSource, DropTarget } = require('react-dnd')
const { getEmptyImage } = require('react-dnd-electron-backend')
const { bool, func, number, shape, string } = require('prop-types')
const { pure } = require('../util')
const { bounds } = require('../../dom')
const { DND } = require('../../constants')


class SelectionIterable extends PureComponent {
  constructor(props) {
    super(props)

    this.state = {
      offset: null
    }
  }

  componentDidMount() {
    this.props.dragPreview(getEmptyImage())
  }

  componentDidUpdate({ isActive }) {
    if (this.props.isActive && !isActive) {
      this.container.scrollIntoViewIfNeeded()
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


  setContainer = (container) => {
    this.container = container
  }

  select = () => {
    this.props.onSelect(this.props.selection)
  }

  open = () => {
    this.props.onItemOpen(this.props.selection)
  }

  handleContextMenu = (event) => {
    if (!this.props.isDisabled) {
      const { photo, selection } = this.props
      this.select()

      this.props.onContextMenu(event, 'selection', {
        id: photo.id,
        item: photo.item,
        path: photo.path,
        selection: selection.id
      })
    }
  }

  connect(element) {
    if (this.props.isSortable) element = this.props.dropTarget(element)
    if (this.isDraggable) element = this.props.dragSource(element)

    return element
  }

  renderThumbnail(props) {
    return (
      <Thumbnail {...props}
        id={this.props.photo.id}
        angle={this.props.selection.angle}
        mimetype={this.props.photo.mimetype}
        mirror={this.props.selection.mirror}
        orientation={this.props.photo.orientation}
        cache={this.props.cache}
        size={this.props.size}/>
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
      mirror: bool,
    }).isRequired,
    size: number.isRequired,
    onContextMenu: func.isRequired,
    onDropSelection: func.isRequired,
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
      id: selection.id,
      photo: selection.photo,
      angle: selection.angle,
      mirror: selection.mirror,
      orientation: photo.orientation,
      adj: getAdjacent(selection).map(s => s && s.id)
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
    const { top, left, width, height } = bounds(component.container)
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


module.exports = {
  SelectionIterable
}
