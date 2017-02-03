'use strict'

const React = require('react')
const { Component, PropTypes } = React
const { DropTarget } = require('react-dnd')
const { NativeTypes } = require('react-dnd-electron-backend')
const { get, move, times } = require('../../common/util')

const isValidImage = file => file.type === 'image/jpeg'


class PhotoIterator extends Component {

  get size() {
    return this.constructor.ZOOM[this.props.zoom]
  }

  get classes() {
    return {
      'drop-target': true,
      'over': this.props.isOver && this.props.canDrop
    }
  }

  isSelected(photo) {
    return this.props.selected === photo.id
  }

  isContext(photo) {
    return get(this.props.ui, 'context.photo.id') === photo.id
  }

  handleSelect = (photo) => {
    if (!this.isSelected(photo)) {
      this.props.onSelect({
        photo: photo.id, item: photo.item
      })
    }
  }

  handleItemOpen = (photo) => {
    if (!this.props.isItemOpen) {
      this.props.onItemOpen({
        id: photo.item, photos: [photo.id]
      })
    }
  }

  handleDropPhoto = ({ id, to, offset }) => {
    const { onSort, photos } = this.props

    const item = photos[0].item
    const order = move(photos.map(photo => photo.id), id, to, offset)

    onSort({ item, photos: order })
  }

  handleClickOutside = () => {
    if (this.props.selected) {
      this.props.onSelect()
    }
  }

  handleClickInside = (event) => {
    event.stopPropagation()
  }

  connect(element) {
    return this.props.isDisabled ? element : this.props.dt(element)
  }

  map(fn) {
    return this.props.photos.map(photo => fn({
      photo,
      cache: this.props.cache,
      size: this.size,
      isDisabled: this.props.isDisabled,
      isSelected: this.isSelected(photo),
      isContext: this.isContext(photo),
      onClick: this.handleClickInside,
      onDropPhoto: this.handleDropPhoto,
      onSelect: this.handleSelect,
      onItemOpen: this.handleItemOpen,
      onContextMenu: this.props.onContextMenu
    }))
  }


  static ZOOM = [
    24,
    ...times(51, i => i * 2 + 26),
    ...times(32, i => i * 4 + 128),
    256
  ]

  static DropTargetSpec = {
    drop({ onDropImages }, monitor) {
      const { files } = monitor.getItem()

      const images = files
        .filter(isValidImage)
        .map(file => file.path)

      return onDropImages(images), { images }
    },

    canDrop(_, monitor) {
      return !!monitor.getItem().files.find(isValidImage)
    }
  }

  static DropTargetCollect = (connect, monitor) => ({
    dt: connect.dropTarget(),
    isOver: monitor.isOver(),
    canDrop: monitor.canDrop()
  })

  static wrap() {
    return DropTarget(
      NativeTypes.FILE, this.DropTargetSpec, this.DropTargetCollect
    )(this)
  }

  static propTypes = {
    photos: PropTypes.arrayOf(
      PropTypes.shape({
        id: PropTypes.number.isRequired
      })
    ).isRequired,

    cache: PropTypes.string.isRequired,
    selected: PropTypes.number,
    ui: PropTypes.object,
    zoom: PropTypes.number,

    isItemOpen: PropTypes.bool,
    isDisabled: PropTypes.bool,
    isOver: PropTypes.bool,
    canDrop: PropTypes.bool,

    dt: PropTypes.func.isRequired,

    onDropImages: PropTypes.func.isRequired,
    onContextMenu: PropTypes.func.isRequired,
    onItemOpen: PropTypes.func.isRequired,
    onSelect: PropTypes.func.isRequired,
    onSort: PropTypes.func.isRequired
  }
}

module.exports = {
  PhotoIterator
}
