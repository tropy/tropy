'use strict'

const React = require('react')
const { DragSource, DropTarget, getEmptyImage } = require('../dnd')
const { compose, map, filter, into } = require('transducers.js')
const { DND } = require('../../constants')
const { isMeta } = require('../../keymap')
const { bounds } = require('../../dom')
const { pure } = require('../util')

const {
  bool, func, number, object, shape, arrayOf
} = require('prop-types')


class ItemIterable extends React.PureComponent {
  state = {
    offset: null
  }

  componentDidMount() {
    this.props.dp(getEmptyImage())
  }

  get classes() {
    return {
      'item': true,
      'drop-target': !this.props.isDisabled,
      'active': this.props.isSelected,
      'over': this.props.isOver && this.props.canDrop && this.state.offset == null,
      'dragging': this.props.isDragging,
      'last': this.props.isLast,
      [this.direction]: this.props.isOver && this.state.offset != null
    }
  }

  get direction() {
    return this.state.offset ? 'after' : 'before'
  }

  // Subtle: when an item is not selected, we need to select
  // on mouse down, because the mouse down may kick-off a
  // drag event. If the item is already selected, we handle
  // selection in the click event for the same reason!
  handleMouseDown = (event) => {
    if (this.props.isSelected) {
      this.wasSelected = true
    } else {
      this.wasSelected = false
      this.handleSelect(event)
    }
  }

  handleClick = (event) => {
    if (this.props.isSelected && this.wasSelected) {
      this.handleSelect(event)
    }
  }

  handleOpen = () => {
    const { id, photos } = this.props.item
    this.props.onItemOpen({ id, photos })
  }

  handleSelect = (event) => {
    if (!(event.button > 2)) {
      this.props.onSelect(this.props.item, {
        isMeta: isMeta(event),
        isRange: event.shiftKey
      })
    }
  }

  handleContextMenu = (event) => {
    if (!this.props.isSelected) {
      this.handleSelect(event)
    }

    this.props.onContextMenu(event, this.props.item)
  }


  setContainer = (container) => {
    this.container = container
  }


  connect(element) {
    return (this.props.isDisabled) ?
      element : this.props.ds(this.props.dt(element))
  }


  static DragSourceSpec = {
    beginDrag({ item, getSelection }) {
      return {
        items: into(
          [{ ...item }],
          compose(filter(id => id !== item.id), map(id => ({ id }))),
          getSelection()
        )
      }
    },

    canDrag({ item }) {
      return !item.deleted
    }
  }

  static DragSourceCollect = (connect, monitor) => ({
    ds: connect.dragSource(),
    dp: connect.dragPreview(),
    isDragging: monitor.isDragging()
  })


  static DropTargetSpec = {
    hover({ isVertical, item }, monitor, component) {
      const { top, left, width, height } = bounds(component.container)
      const { x, y } = monitor.getClientOffset()
      const draggedMonitor = monitor.getItem()
      const dragged = draggedMonitor.items[0]
      let offset = null

      if (item.id !== dragged.id) {
        let calc = isVertical ? ((y - top) / height) : ((x - left) / width)
        offset = calc < 0.20 ? 0 : calc > 0.80 ? 1 : null
      }
      component.setState({ offset })
    },

    drop({ item, onDropPhotos, onDropItems }, monitor) {
      switch (monitor.getItemType()) {
        case DND.PHOTO:
          return onDropPhotos({
            item: item.id, photos: [monitor.getItem()]
          })
        case DND.ITEMS:
          return onDropItems([
            item.id, ...monitor.getItem().items.map(({ id }) => id)
          ])
      }
    },

    canDrop({ item }, monitor) {
      if (item.deleted) return false

      switch (monitor.getItemType()) {
        case DND.PHOTO: {
          const photo = monitor.getItem()
          if (item.id === photo.item) return false
          break
        }
        case DND.ITEMS: {
          const { items } = monitor.getItem()
          if (items.find(({ id }) => item.id === id)) return false
          break
        }
      }

      return true
    }
  }

  static DropTargetCollect = (connect, monitor) => ({
    dt: connect.dropTarget(),
    isOver: monitor.isOver(),
    canDrop: monitor.canDrop()
  })

  static wrap() {
    return pure(DragSource(
      DND.ITEMS, this.DragSourceSpec, this.DragSourceCollect
    )(DropTarget(
      [DND.ITEMS, DND.PHOTO], this.DropTargetSpec, this.DropTargetCollect
    )(this)))
  }


  static propTypes = {
    isDragging: bool,
    isLast: bool,
    isOver: bool,
    isSelected: bool,
    isDisabled: bool,
    isVertical: bool,
    canDrop: bool,
    photos: object.isRequired,
    tags: object.isRequired,

    item: shape({
      id: number.isRequired,
      deleted: bool,
      photos: arrayOf(number)
    }).isRequired,

    ds: func.isRequired,
    dt: func.isRequired,
    dp: func.isRequired,

    getSelection: func.isRequired,

    onContextMenu: func.isRequired,
    onDropItems: func.isRequired,
    onDropPhotos: func.isRequired,
    onItemOpen: func.isRequired,
    onPhotoError: func.isRequired,
    onSelect: func.isRequired
  }
}

module.exports = {
  ItemIterable
}
