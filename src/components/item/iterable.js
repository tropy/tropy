'use strict'

const React = require('react')
const { PropTypes, PureComponent } = React
const { DragSource, DropTarget } = require('react-dnd')
const { getEmptyImage } = require('react-dnd-electron-backend')
const { compose, map, filter, into } = require('transducers.js')
const { DND } = require('../../constants')
const { meta } = require('../../common/os')
const { pure } = require('../util')
const { bool, func, number, object, shape, arrayOf } = PropTypes


class ItemIterable extends PureComponent {
  componentDidMount() {
    this.props.dp(getEmptyImage())
  }

  componentDidUpdate(props) {
    if (this.props.isSelected && !props.isSelected) {
      this.container.scrollIntoViewIfNeeded(false)
    }
  }

  get classes() {
    return {
      'item': true,
      'drop-target': !this.props.isDisabled,
      'active': this.props.isSelected,
      'over': this.props.isOver && this.props.canDrop,
      'dragging': this.props.isDragging,
      'last': this.props.isLast,
    }
  }

  handleOpen = () => {
    const { item, onItemOpen } = this.props

    onItemOpen({
      id: item.id, photos: item.photos
    })
  }

  handleSelect = (event) => {
    const { item, isSelected, onSelect } = this.props

    if (meta(event)) {
      onSelect({ items: [item.id] }, isSelected ? 'remove' : 'merge')

    } else {
      if (!isSelected) {
        onSelect({ items: [item.id] }, 'replace')
      }
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
    onSelect: func.isRequired
  }
}

module.exports = {
  ItemIterable
}
