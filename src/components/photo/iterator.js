'use strict'

const React = require('react')
const { Iterator } = require('../iterator')
const { DropTarget } = require('react-dnd')
const { DND } = require('../../constants')
const { move, adjacent } = require('../../common/util')
const { match } = require('../../keymap')

const {
  arrayOf, bool, func, number, object, string, shape
} = require('prop-types')


class PhotoIterator extends Iterator {
  get iteration() {
    return this.props.photos
  }

  get classes() {
    return {
      'drop-target': this.isSortable,
      'over': this.props.isOver,
      [this.orientation]: true
    }
  }

  get isSortable() {
    return !this.props.isDisabled && this.props.photos.length > 1
  }

  isSelected(photo) {
    return this.props.selection === photo.id
  }

  getNextPhoto(offset = 1) {
    const { photos, selection } = this.props

    if (!photos.length) return null
    if (!selection) return photos[0]

    return photos[this.idx[selection] + offset]
  }

  getPrevPhoto(offset = 1) {
    return this.getNextPhoto(-offset)
  }

  getCurrentPhoto() {
    return this.getNextPhoto(0)
  }

  getAdjacent = (photo) => {
    return adjacent(this.props.photos, photo)
  }

  handleFocus = () => {
    this.select(this.getCurrentPhoto())
  }

  select = (photo) => {
    if (photo && !this.isSelected(photo)) {
      this.props.onSelect({
        photo: photo.id, item: photo.item, note: photo.notes[0]
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

  handleDelete = (photo) => {
    if (!this.props.isDisabled) {
      this.props.onDelete({ item: photo.item, photos: [photo.id] })
    }
  }

  handleDropPhoto = ({ id, to, offset }) => {
    const { onSort, photos } = this.props

    const item = photos[0].item
    const order = move(photos.map(photo => photo.id), id, to, offset)

    onSort({ item, photos: order })
  }

  handleKeyDown = (event) => {
    switch (match(this.props.keymap, event)) {
      case (this.isVertical ? 'up' : 'left'):
        this.select(this.getPrevPhoto())
        break
      case (this.isVertical ? 'down' : 'right'):
        this.select(this.getNextPhoto())
        break
      case 'open':
        this.handleItemOpen(this.getCurrentPhoto())
        break
      case 'delete':
        this.handleDelete(this.getCurrentPhoto())
        this.select(this.getNextPhoto() || this.getPrevPhoto())
        break
      default:
        return
    }

    event.preventDefault()
    event.stopPropagation()
  }

  map(fn) {
    this.idx = {}
    const { isSortable } = this

    return this.props.photos.map((photo, index) => {
      this.idx[photo.id] = index

      return fn({
        photo,
        cache: this.props.cache,
        isDisabled: this.props.isDisabled,
        isSelected: this.isSelected(photo),
        isSortable,
        isLast: index === this.props.photos.length - 1,
        isVertical: this.isVertical,
        getAdjacent: this.getAdjacent,
        onDropPhoto: this.handleDropPhoto,
        onSelect: this.select,
        onItemOpen: this.handleItemOpen,
        onContextMenu: this.props.onContextMenu
      })
    })
  }

  connect(element) {
    return this.isSortable ? this.props.dt(element) : element
  }


  static DropTargetSpec = {
    drop({ photos }, monitor) {
      if (monitor.didDrop()) return

      const { id } = monitor.getItem()
      const to = photos[photos.length - 1].id

      if (id !== to) {
        return { id, to, offset: 1 }
      }
    }
  }

  static DropTargetCollect = (connect, monitor) => ({
    dt: connect.dropTarget(),
    isOver: monitor.isOver({ shallow: true })
  })

  static wrap() {
    const Component = DropTarget(
        DND.PHOTO,
        this.DropTargetSpec,
        this.DropTargetCollect
      )(this)

    Component.props = this.props

    return Component
  }

  static get props() {
    return Object.keys(this.propTypes)
  }

  static propTypes = {
    photos: arrayOf(
      shape({
        id: number.isRequired
      })
    ).isRequired,

    cache: string.isRequired,
    keymap: object.isRequired,
    selection: number,
    size: number.isRequired,

    isItemOpen: bool,
    isDisabled: bool,
    isOver: bool,

    dt: func.isRequired,

    onContextMenu: func.isRequired,
    onDelete: func.isRequired,
    onItemOpen: func.isRequired,
    onSelect: func.isRequired,
    onSort: func.isRequired
  }
}


module.exports = {
  PhotoIterator
}
