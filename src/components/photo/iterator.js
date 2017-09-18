'use strict'

const React = require('react')
const { Iterator } = require('../iterator')
const { DropTarget } = require('react-dnd')
const { DND } = require('../../constants')
const { move } = require('../../common/util')

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
      'photo': true,
      [this.orientation]: true
    }
  }

  get isSortable() {
    return !this.props.isDisabled && this.size > 1
  }

  isSelected(photo) {
    return this.props.current === photo.id
  }

  isActive(selection) {
    return this.props.selection === selection
  }

  isExpandable(photo) {
    return photo != null &&
      photo.selections != null && photo.selections.length > 0
  }

  isExpanded(photo) {
    return photo != null &&
      this.props.expanded.includes(photo.id)
  }

  get keymap() {
    return this.props.keymap.PhotoIterator
  }


  getNextPhoto(offset = 1) {
    const { photos, current } = this.props

    if (!photos.length) return null
    if (!current) return photos[0]

    return photos[this.idx[current] + offset]
  }

  getPrevPhoto(offset = 1) {
    return this.getNextPhoto(-offset)
  }

  getCurrentPhoto() {
    return this.getNextPhoto(0)
  }

  handleFocus = () => {
    this.select(this.getCurrentPhoto())
  }

  select = (photo) => {
    if (photo == null ||
      this.isSelected(photo) && this.isActive(photo.selection)) {
      return
    }

    this.props.onSelect({
      photo: photo.id,
      item: photo.item,
      note: photo.notes[0],
      selection: photo.selection
    })
  }

  contract = (photo) => {
    if (this.isExpandable(photo)) {
      this.props.onContract(
        this.isGrid ? this.props.expanded : [photo.id]
      )

      if (this.isSelected(photo)) {
        this.props.onSelect({
          photo: photo.id,
          item: photo.item,
          note: photo.notes[0]
        })
      }
    }
  }

  expand = (photo) => {
    if (this.isExpandable(photo)) {
      this.props.onExpand(photo.id)
    }
  }


  handleItemOpen = (photo) => {
    if (this.props.isItemOpen) {
      return this.expand(photo)
    }

    this.props.onItemOpen({
      id: photo.item,
      photos: [photo.id],
      selection: photo.selection
    })
  }

  handleDelete = ({ id, item, selection }) => {
    if (!this.props.isDisabled) {
      this.props.onDelete((selection == null) ?
        { item, photos: [id] } :
        { photo: id, selections: [selection] }
      )
    }
  }

  handleDropPhoto = ({ id, to, offset }) => {
    const { onSort, photos } = this.props

    const item = photos[0].item
    const order = move(photos.map(photo => photo.id), id, to, offset)

    onSort({ item, photos: order })
  }

  getIterableProps(photo, index) {
    return {
      photo,
      cache: this.props.cache,
      selection: this.props.selection,
      isDisabled: this.props.isDisabled,
      isExpandable: this.isExpandable(photo),
      isExpanded: this.isExpanded(photo),
      isSelected: this.isSelected(photo),
      isSortable: this.isSortable,
      isLast: this.isLast(index),
      isVertical: this.isVertical,
      getAdjacent: this.getAdjacent,
      onContextMenu: this.props.onContextMenu,
      onContract: this.contract,
      onDropPhoto: this.handleDropPhoto,
      onExpand: this.expand,
      onItemOpen: this.handleItemOpen,
      onSelect: this.select
    }
  }

  map(fn) {
    this.idx = {}

    return this.props.photos.map((photo, index) => {
      this.idx[photo.id] = index
      return fn(this.getIterableProps(photo, index))
    })
  }

  connect(element) {
    return this.isSortable ? this.props.dt(element) : element
  }


  static asDropTarget() {
    return DropTarget(
        DND.PHOTO,
        DropTargetSpec,
        DropTargetCollect
      )(this)
  }

  static propTypes = {
    photos: arrayOf(
      shape({
        id: number.isRequired
      })
    ).isRequired,

    cache: string.isRequired,
    current: number,
    expanded: arrayOf(number).isRequired,
    keymap: object.isRequired,
    selection: number,
    selections: object.isRequired,
    size: number.isRequired,

    isItemOpen: bool,
    isDisabled: bool,
    isOver: bool,

    dt: func.isRequired,

    onContract: func.isRequired,
    onContextMenu: func.isRequired,
    onDelete: func.isRequired,
    onExpand: func.isRequired,
    onItemOpen: func.isRequired,
    onSelect: func.isRequired,
    onSort: func.isRequired,
    onSelectionSort: func.isRequired
  }
}

const DropTargetSpec = {
  drop({ photos }, monitor) {
    if (monitor.didDrop()) return

    const { id } = monitor.getItem()
    const to = photos[photos.length - 1].id

    if (id !== to) {
      return { id, to, offset: 1 }
    }
  }
}

const DropTargetCollect = (connect, monitor) => ({
  dt: connect.dropTarget(),
  isOver: monitor.isOver({ shallow: true })
})


module.exports = {
  PhotoIterator
}
