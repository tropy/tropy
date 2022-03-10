import React from 'react'
import { compose, map, filter, into } from 'transducers.js'
import { DND, DragSource, DropTarget, getEmptyImage } from '../dnd'
import { pure } from '../util'
import { bool, func, number, object, shape, arrayOf } from 'prop-types'


export class ItemIterable extends React.PureComponent {
  componentDidMount() {
    this.props.dp(getEmptyImage())
  }

  get classes() {
    return {
      'item': true,
      'drop-target': !this.props.isReadOnly,
      'active': this.props.isSelected,
      'over': this.props.isOver && this.props.canDrop,
      'dragging': this.props.isDragging
    }
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
      this.props.onSelect(this.props.item, event)
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
    return (this.props.isReadOnly) ?
      element :
      this.props.ds(this.props.dt(element))
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
    isOver: bool,
    isSelected: bool,
    isReadOnly: bool,
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
