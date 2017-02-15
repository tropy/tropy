'use strict'

const React = require('react')
const { PropTypes, PureComponent } = React
const { DragSource, DropTarget } = require('react-dnd')
const { getEmptyImage } = require('react-dnd-electron-backend')
const { compose, map, filter, into } = require('transducers.js')
const { DND } = require('../../constants')
const { meta } = require('../../common/os')
const { bool, func, number, shape, oneOf, arrayOf } = PropTypes

class ItemIterable extends PureComponent {

  componentDidMount() {
    this.props.dp(getEmptyImage())
  }

  componentDidUpdate(props) {
    if (this.props.hasFocus && !props.hasFocus) {
      this.container.focus()
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
      [this.props.orientation]: true
    }
  }

  get isVertical() {
    return this.props.orientation === 'vertical'
  }

  get tabIndex() {
    return this.props.hasFocus ? 0 : -1
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
      onSelect(item.id, isSelected ? 'remove' : 'merge')

    } else {
      if (!isSelected) {
        onSelect(item.id, 'replace')
      }
    }
  }

  handleContextMenu = (event) => {
    if (!this.props.isSelected) {
      this.handleSelect(event)
    }

    this.props.onContextMenu(event, this.props.item)
  }

  handleKeyDown = (event) => {
    const { index, isSelected, onSelectAt } = this.props

    switch (event.key) {
      case 'ArrowUp':
        onSelectAt(isSelected ? index - 1 : index)
        break
      case 'ArrowDown':
        onSelectAt(isSelected ? index + 1 : index)
        break
    }
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
    drop({ item, onDropPhotos }, monitor) {
      const photo = monitor.getItem()

      onDropPhotos({
        item: item.id, photos: [photo]
      })
    },

    canDrop({ item }, monitor) {
      const photo = monitor.getItem()

      if (item.deleted) return false
      if (item.id === photo.item) return false

      return true
    }
  }

  static DropTargetCollect = (connect, monitor) => ({
    dt: connect.dropTarget(),
    isOver: monitor.isOver(),
    canDrop: monitor.canDrop()
  })

  static wrap() {
    return DragSource(
      DND.ITEMS, this.DragSourceSpec, this.DragSourceCollect
    )(DropTarget(
      DND.PHOTO, this.DropTargetSpec, this.DropTargetCollect
    )(this))
  }


  static propTypes = {
    hasFocus: bool,
    isDragging: bool,
    isLast: bool,
    isOver: bool,
    isSelected: bool,
    isDisabled: bool,
    canDrop: bool,

    item: shape({
      id: number.isRequired,
      deleted: bool,
      photos: arrayOf(number)
    }).isRequired,

    index: number.isRequired,
    size: number.isRequired,
    orientation: oneOf(['horizontal', 'vertical']),

    ds: func.isRequired,
    dt: func.isRequired,
    dp: func.isRequired,

    getSelection: func.isRequired,

    onContextMenu: func.isRequired,
    onDropPhotos: func.isRequired,
    onItemOpen: func.isRequired,
    onSelect: func.isRequired,
    onSelectAt: func.isRequired
  }

  static defaultProps = {
    orientation: 'vertical'
  }
}

module.exports = {
  ItemIterable
}
