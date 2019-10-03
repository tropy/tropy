'use strict'

const React = require('react')
const { DragSource, DropTarget, getEmptyImage } = require('../dnd')
const { compose, map, filter, into } = require('transducers.js')
const { DND } = require('../../constants')
const { isMeta } = require('../../keymap')
const { bounds } = require('../../dom')
const { pure } = require('../util')
const { noop } = require('../../common/util')

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
      'over': this.props.isOver &&
        this.props.canDrop &&
        this.state.offset == null,
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
    beginDrag({ item, getSelection, onDragStart }) {
      if (onDragStart) onDragStart()
      return {
        items: into(
          [{ ...item }],
          compose(filter(id => id !== item.id), map(id => ({ id }))),
          getSelection()
        )
      }
    },

    endDrag({ onDragStop }) {
      if (onDragStop) onDragStop()
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
    hover({ isVertical, item, isItemSortable }, monitor, component) {
      const { top, left, width, height } = bounds(component.container)
      const { x, y } = monitor.getClientOffset()
      const draggedMonitor = monitor.getItem()
      let offset = null
      let dragged
      if (draggedMonitor.items) {
        dragged = draggedMonitor.items[0]
      } else {
        dragged = draggedMonitor.item
      }

      if (item.id !== dragged.id && isItemSortable) {
        let calc = isVertical ? ((y - top) / height) : ((x - left) / width)
        offset = calc < 0.20 ? 0 : calc > 0.80 ? 1 : null
      }
      component.setState({ offset })
    },

    drop({ item, onDropPhotos, onDropItems, onItemOrder }, monitor, component) {
      switch (monitor.getItemType()) {
        case DND.PHOTO:
          return onDropPhotos({
            item: item.id, photos: [monitor.getItem()]
          })
        case DND.ITEMS:
          if (component.state.offset !== null) {
            return onItemOrder([{ item }])
          } else {
            return onDropItems([
              item.id, ...monitor.getItem().items.map(({ id }) => id)
            ])
          }
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
    onDragStart: func.isRequired,
    onDragStop: func.isRequired,
    onDropItems: func.isRequired,
    onDropPhotos: func.isRequired,
    onItemOpen: func.isRequired,
    onItemOrder: func.isRequired,
    onPhotoError: func.isRequired,
    onSelect: func.isRequired
  }

  static defaultProps = {
    onDragStart: noop,
    onDragStop: noop
  }
}

module.exports = {
  ItemIterable
}
