'use strict'

const React = require('react')
const { Iterator } = require('../iterator')
const { DropTarget } = require('react-dnd')
const { DND } = require('../../constants')
const { move } = require('../../common/util')
const { ceil, floor, min } = Math

const {
  arrayOf, bool, func, number, object, string, shape
} = require('prop-types')

const byIdx = ([a], [b]) => (a < b) ? -1 : (a > b) ? 1 : 0


class PhotoIterator extends Iterator {
  componentWillReceiveProps(props) {
    if (this.props.size !== props.size ||
      this.props.photos !== props.photos ||
      this.props.expanded !== props.expanded) {
      this.update(props)
    }
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

    if (scrollIntoView && !this.isIterableMapped(photo)) {
      this.scrollIntoView(photo)
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
      this.props.onContract(
        this.isGrid ? this.props.expanded.map(p => p.id) : [photo.id]
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
    expanded: arrayOf(object).isRequired,
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
