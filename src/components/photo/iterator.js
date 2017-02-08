'use strict'

const React = require('react')
const { PureComponent, PropTypes } = React
const { ClickCatcher } = require('../click-catcher')
const { DND } = require('../../constants')
const { get, move, times } = require('../../common/util')
const { bool, func, number, string, object, shape, arrayOf } = PropTypes


class PhotoIterator extends PureComponent {

  get size() {
    return this.constructor.ZOOM[this.props.zoom]
  }

  get classes() {
    return {}
  }

  get isSortable() {
    return !this.props.isDisabled && this.props.photos.length > 1
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

  handleDropLastPhoto = ({ id }) => {
    const { photos } = this.props
    const to = photos[photos.length - 1].id

    if (id !== to) {
      this.handleDropPhoto({ id, to, offset: 1 })
    }
  }

  handleClickOutside = () => {
    if (this.props.selected) {
      this.props.onSelect()
    }
  }

  map(fn) {
    const { isSortable } = this

    return this.props.photos.map((photo, idx) => fn({
      photo,
      cache: this.props.cache,
      size: this.size,
      isDisabled: this.props.isDisabled,
      isSelected: this.isSelected(photo),
      isSortable,
      isContext: this.isContext(photo),
      isLast: idx === this.props.photos.length - 1,
      onDropPhoto: this.handleDropPhoto,
      onSelect: this.handleSelect,
      onItemOpen: this.handleItemOpen,
      onClickOutside: this.handleClickOutside,
      onContextMenu: this.props.onContextMenu
    }))
  }

  renderClickCatcher() {
    return (
      <ClickCatcher
        isDisabled={!this.isSortable}
        accept={[DND.PHOTO]}
        onDrop={this.handleDropLastPhoto}
        onClick={this.handleClickOutside}/>
    )
  }


  static ZOOM = [
    24,
    ...times(51, i => i * 2 + 26),
    ...times(32, i => i * 4 + 128),
    256
  ]


  static propTypes = {
    photos: arrayOf(
      shape({
        id: number.isRequired
      })
    ).isRequired,

    cache: string.isRequired,
    selected: number,
    ui: object.isRequired,
    zoom: number.isRequired,

    isItemOpen: bool,
    isDisabled: bool,

    onContextMenu: func.isRequired,
    onItemOpen: func.isRequired,
    onSelect: func.isRequired,
    onSort: func.isRequired
  }
}

module.exports = {
  PhotoIterator
}
