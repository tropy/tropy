'use strict'

const React = require('react')
const { Iterator } = require('../iterator')
const { DropTarget } = require('react-dnd')
const { NativeTypes } = require('react-dnd-electron-backend')
const { DND } = require('../../constants')
const { isImageSupported } = require('../../image')
const { move } = require('../../common/util')
const { ceil, floor, min } = Math
const { on, off } = require('../../dom')

const {
  arrayOf, bool, func, number, object, string, shape
} = require('prop-types')

const byIdx = ([a], [b]) => (a < b) ? -1 : (a > b) ? 1 : 0


class PhotoIterator extends Iterator {
  componentDidMount() {
    super.componentDidMount()
    on(document, 'global:next-photo', this.handleNextPhoto)
    on(document, 'global:prev-photo', this.handlePrevPhoto)
  }

  componentWillUnmount() {
    super.componentWillUnmount()
    this.props.onBlur()
    off(document, 'global:next-photo', this.handleNextPhoto)
    off(document, 'global:prev-photo', this.handlePrevPhoto)
  }

  componentWillReceiveProps(props) {
    if (this.props.size !== props.size ||
      this.props.photos !== props.photos ||
      this.props.expanded !== props.expanded) {
      this.update(props)
    }
  }

  get classes() {
    return {
      'drop-target': !this.isDisabled,
      'over': this.props.isOver,
      'over-file': this.props.isOverFile,
      [this.orientation]: true
    }
  }

  get isSortable() {
    return !this.props.isDisabled && this.size > 1
  }

  getIterables(props = this.props) {
    return props.photos || super.getIterables()
  }

  getRows(state = this.state, props = this.props) {
    return super.getRows(state, props) + this.getExpansionRows(state, props)
  }

  getExpansionRows({ cols } = this.state, props = this.props) {
    let rows = []

    for (let photo of props.expanded) {
      let exp = ceil(photo.selections.length / cols)
      let idx = this.indexOf(photo.id, props)
      if (idx === -1) continue
      rows.push([idx, exp])
    }

    rows = rows.sort(byIdx)
    let total = 0
    this.expRows = []

    for (let i = 0; i < rows.length; ++i) {
      let [idx, exp] = rows[i]
      idx += total
      for (let j = 1; j <= exp; ++j) {
        this.expRows.push([++idx, ++total, j])
      }
    }

    return total
  }

  getExpansionRowsBefore(row) {
    let exp = [0, 0]

    if (this.expRows != null) {
      for (let i = 0; i < this.expRows.length; ++i) {
        let cur = this.expRows[i]
        if (row < cur[0]) break
        if (row === cur[0]) exp[1] = cur[2]
        exp[0] = cur[1]
      }
    }

    return exp
  }

  getOffset(state = this.state) {
    let offset = super.getOffset(state)
    let row = floor(offset / state.rowHeight)
    let [, adj] = this.getExpansionRowsBefore(row)
    return (row - adj) * state.rowHeight
  }

  getIterableRange() {
    const { cols, offset, overscan, rowHeight } = this.state

    const row = floor(offset / rowHeight)
    const exp = this.getExpansionRowsBefore(row)
    const from = cols * (row - exp[0])
    const size = cols * overscan

    return {
      from, size, to: min(from + size, this.size), exp
    }
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
      this.props.expanded.includes(photo)
  }

  get keymap() {
    return this.props.keymap.PhotoIterator
  }

  head() {
    return this.props.current
  }

  select = (photo, { scrollIntoView, throttle } = {}) => {
    if (photo == null ||
      this.isSelected(photo) && this.isActive(photo.selection)) {
      return
    }

    if (scrollIntoView) {
      this.scrollIntoView(photo, false)
    }

    this.props.onSelect({
      photo: photo.id,
      item: photo.item,
      note: photo.notes[0],
      selection: photo.selection
    }, { throttle })
  }

  contract = (photo) => {
    if (this.isExpandable(photo)) {
      this.props.onContract([photo.id])

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

  handleFocus = () => {
    // No auto-select, because that could change the active photo!
    this.props.onTabFocus()
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

  handleNextPhoto = () => {
    this.select(this.next(), { scrollIntoView: true, throttle: true })
  }

  handlePrevPhoto = () => {
    this.select(this.prev(), { scrollIntoView: true, throttle: true })
  }


  getIterableProps(photo, index) {
    return {
      photo,
      cache: this.props.cache,
      selection: this.props.selection,
      isDisabled: this.props.isDisabled,
      isExpandable: this.isExpandable(photo),
      isExpanded: this.isExpanded(photo),
      isItemOpen: this.props.isItemOpen,
      isSelected: this.isSelected(photo),
      isSortable: this.isSortable,
      isLast: this.isLast(index),
      isVertical: this.isVertical,
      getAdjacent: this.getAdjacent,
      onContextMenu: this.props.onContextMenu,
      onContract: this.contract,
      onDropPhoto: this.handleDropPhoto,
      onError: this.props.onError,
      onExpand: this.expand,
      onItemOpen: this.handleItemOpen,
      onSelect: this.select
    }
  }

  preview({ id, item }) {
    this.props.onItemPreview({ id: item, photos: [id] })
  }


  connect(element) {
    return this.isDisabled ? element : this.props.dt(element)
  }


  static asDropTarget() {
    return DropTarget(
        [DND.PHOTO, NativeTypes.FILE],
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
    expanded: arrayOf(object).isRequired,
    keymap: object.isRequired,
    selection: number,
    selections: object.isRequired,
    size: number.isRequired,

    canCreate: bool,
    isItemOpen: bool,
    isDisabled: bool,
    isOver: bool,
    isOverFile: bool,

    dt: func.isRequired,

    onBlur: func.isRequired,
    onContract: func.isRequired,
    onContextMenu: func.isRequired,
    onCreate: func.isRequired,
    onDelete: func.isRequired,
    onExpand: func.isRequired,
    onError: func.isRequired,
    onTabFocus: func.isRequired,
    onItemOpen: func.isRequired,
    onItemPreview: func.isRequired,
    onSelect: func.isRequired,
    onSort: func.isRequired,
    onSelectionSort: func.isRequired
  }
}

const DropTargetSpec = {
  drop({ photos, onCreate }, monitor) {
    if (monitor.didDrop()) return

    switch (monitor.getItemType()) {
      case DND.PHOTO: {
        let { id } = monitor.getItem()
        let to = photos[photos.length - 1].id

        if (id !== to)  {
          return { id, to, offset: 1 }
        }
        break
      }
      case NativeTypes.FILE: {
        let files = monitor.getItem()
          .files
          .filter(isImageSupported)
          .map(file => file.path)

        if (files.length) {
          onCreate({ files })
          return { files }
        }
        break
      }
    }
  },

  canDrop({ canCreate, photos }, monitor) {
    switch (monitor.getItemType()) {
      case DND.PHOTO:
        return photos.length > 1
      case NativeTypes.FILE:
        return canCreate &&
          !!monitor.getItem().types.find(type => isImageSupported({ type }))
      default:
        return false
    }
  }
}

const DropTargetCollect = (connect, monitor) => {
  let isOver = monitor.isOver({ shallow: true }) && monitor.canDrop()
  let type = monitor.getItemType()

  return {
    dt: connect.dropTarget(),
    isOver: isOver && type === DND.PHOTO,
    isOverFile: isOver && type === NativeTypes.FILE
  }
}


module.exports = {
  PhotoIterator
}
