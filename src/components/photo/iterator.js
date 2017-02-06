'use strict'

const React = require('react')
const { Component, PropTypes } = React
const { get, move, times } = require('../../common/util')


class PhotoIterator extends Component {

  get size() {
    return this.constructor.ZOOM[this.props.zoom]
  }

  get classes() {
    return {}
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

  map(fn) {
    return this.props.photos.map((photo, idx) => fn({
      photo,
      cache: this.props.cache,
      size: this.size,
      isFirst: idx === 0,
      isLast: idx === this.props.photos.length - 1,
      isDisabled: this.props.isDisabled,
      isSelected: this.isSelected(photo),
      isContext: this.isContext(photo),
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


  static propTypes = {
    photos: PropTypes.arrayOf(
      PropTypes.shape({
        id: PropTypes.number.isRequired
      })
    ).isRequired,

    cache: PropTypes.string.isRequired,
    selected: PropTypes.number,
    ui: PropTypes.object.isRequired,
    zoom: PropTypes.number.isRequired,

    isItemOpen: PropTypes.bool,
    isDisabled: PropTypes.bool,

    onContextMenu: PropTypes.func.isRequired,
    onItemOpen: PropTypes.func.isRequired,
    onSelect: PropTypes.func.isRequired,
    onSort: PropTypes.func.isRequired
  }
}

module.exports = {
  PhotoIterator
}
