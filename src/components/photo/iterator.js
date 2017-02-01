'use strict'

const React = require('react')
const { Component, PropTypes } = React
const { get, move, times } = require('../../common/util')


class PhotoIterator extends Component {

  get size() {
    return this.constructor.ZOOM[this.props.zoom]
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

  handleOpen = (photo) => {
    if (!this.props.isOpen) {
      this.props.onOpen({
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
      onOpen: this.handleOpen,
      onContextMenu: this.props.onContextMenu
    }))
  }


  static ZOOM = [
    24,
    ...times(51, i => i * 2 + 26),
    ...times(32, i => i * 4 + 128),
    256
  ]

  static propTypes = {
    photos: PropTypes.arrayOf(
      PropTypes.shape({
        id: PropTypes.number.isRequired
      })
    ).isRequired,

    cache: PropTypes.string,
    selected: PropTypes.number,
    ui: PropTypes.object,
    zoom: PropTypes.number,

    isOpen: PropTypes.bool,
    isDisabled: PropTypes.bool,

    onContextMenu: PropTypes.func,
    onOpen: PropTypes.func,
    onSelect: PropTypes.func,
    onSort: PropTypes.func
  }
}

module.exports = {
  PhotoIterator
}
