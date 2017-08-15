'use strict'

const React = require('react')
const { PureComponent } = React
const { Thumbnail } = require('./thumbnail')
const { DragSource, DropTarget } = require('react-dnd')
const { getEmptyImage } = require('react-dnd-electron-backend')
const { bounds } = require('../../dom')
const { pure } = require('../util')
const { pluck } = require('../../common/util')
const { DND } = require('../../constants')

const {
  arrayOf, bool, func, number, string, object, shape
} = require('prop-types')


class PhotoIterable extends PureComponent {
  constructor(props) {
    super(props)

    this.state = {
      offset: null
    }
  }

  componentDidMount() {
    this.props.dp(getEmptyImage())
  }

  componentDidUpdate(props) {
    if (this.props.isSelected && !props.isSelected) {
      this.container.scrollIntoViewIfNeeded()
    }
  }

  get classes() {
    return {
      'photo': true,
      'drop-target': this.props.isSortable,
      'active': this.props.isSelected,
      'over': this.props.isOver,
      'dragging': this.props.isDragging,
      'last': this.props.isLast,
      'expanded': this.props.isExpanded,
      [this.direction]: this.props.isOver && this.state.offset != null
    }
  }

  get direction() {
    return this.state.offset ? 'after' : 'before'
  }

  get isDraggable() {
    return !this.props.isDisabled
  }

  get hasSelections() {
    const { photo } = this.props
    return photo.selections != null && photo.selections.length > 0
  }

  get selections() {
    return pluck(this.props.selections, this.props.photo.selections)
  }

  select = () => {
    if (!this.props.isSelected) {
      const { photo } = this.props

      this.props.onSelect({
        item: photo.item,
        photo: photo.id,
        note: photo.notes[0]
      })
    }
  }

  handleContextMenu = (event) => {
    const { photo, isDisabled, onContextMenu } = this.props

    if (!isDisabled) {
      this.select()

      onContextMenu(event, 'photo', {
        id: photo.id, item: photo.item, path: photo.path
      })
    }
  }

  setContainer = (container) => {
    this.container = container
  }


  connect(element) {
    if (this.props.isSortable) element = this.props.dt(element)
    if (this.isDraggable) element = this.props.ds(element)

    return element
  }

  renderThumbnail(props) {
    return (
      <Thumbnail {...props}
        id={this.props.photo.id}
        angle={this.props.photo.angle}
        mirror={this.props.photo.mirror}
        orientation={this.props.photo.orientation}
        cache={this.props.cache}
        size={this.props.size}/>
    )
  }


  static DragSourceSpec = {
    beginDrag({ photo, getAdjacent }) {
      return {
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
    ds: connect.dragSource(),
    dp: connect.dragPreview(),
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
    dt: connect.dropTarget(),
    isOver: monitor.isOver(),
  })

  static wrap() {
    return pure(DragSource(
      DND.PHOTO, this.DragSourceSpec, this.DragSourceCollect
    )(DropTarget(
      DND.PHOTO, this.DropTargetSpec, this.DropTargetCollect
    )(this)))
  }


  static propTypes = {
    isDisabled: bool,
    isDragging: bool,
    isLast: bool,
    isExpanded: bool,
    isOver: bool,
    isSelected: bool,
    isSortable: bool,
    isVertical: bool,

    photo: shape({
      id: number.isRequired,
      selections: arrayOf(number),
      data: object
    }).isRequired,

    cache: string.isRequired,
    selections: object.isRequired,
    size: number.isRequired,

    ds: func.isRequired,
    dt: func.isRequired,
    dp: func.isRequired,

    getAdjacent: func.isRequired,

    onContextMenu: func.isRequired,
    onContract: func.isRequired,
    onDropPhoto: func.isRequired,
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
