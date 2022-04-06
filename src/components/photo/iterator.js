import React from 'react'
import { DND, DropTarget, getDroppedFiles, hasPhotoFiles } from '../dnd'
import { adjacent, move, noop } from '../../common/util'
import { on, off } from '../../dom'
import { TABS } from '../../constants'

import {
  arrayOf, bool, func, number, object, string, shape
} from 'prop-types'


export class PhotoIterator extends React.Component {
  container = React.createRef()
  state = {}

  componentDidMount() {
    on(document, 'global:next-photo', this.handleNextPhoto)
    on(document, 'global:prev-photo', this.handlePrevPhoto)
  }

  componentWillUnmount() {
    this.props.onBlur()
    off(document, 'global:next-photo', this.handleNextPhoto)
    off(document, 'global:prev-photo', this.handlePrevPhoto)
  }

  get classes() {
    return {
      'over': this.props.isOver,
      'over-file': this.props.isOverFile
    }
  }

  get current() {
    return this.container.current.current
  }

  get isSortable() {
    return !this.props.isDisabled && this.props.photos?.length > 1
  }

  get tabIndex() {
    return this.props.photos.length > 0 ? TABS[this.constructor.name] : null
  }

  isSelected(photo) {
    return this.props.selectedPhotos.includes(photo.id)
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
      !!this.props.expandedPhotos[photo.id]
  }

  get keymap() {
    return this.props.keymap.PhotoIterator
  }

  contract = (photo) => {
    if (this.isExpandable(photo) && this.isExpanded(photo)) {
      this.props.onContract([photo.id])

      if (this.isSelected(photo)) {
        this.props.onSelect({
          photos: [photo.id],
          item: photo.item,
          note: photo.notes[0]
        })
      }
      return true
    }

    return false
  }

  expand = (photo) => {
    if (this.isExpandable(photo) && !this.isExpanded(photo)) {
      this.props.onExpand(photo.id)
      return true
    }

    return false
  }

  handleItemOpen = (photo) => {
    if (this.props.isItemOpen) {
      return this.expand(photo)
    }

    this.props.onItemOpen({
      id: photo.item,
      photo: photo.id,
      selection: photo.selection
    })
  }

  handleDelete = ({ id, item, selection }) => {
    if (!this.props.isDisabled) {
      this.props.onDelete(selection != null ?
        { photo: id, selections: [selection] } :
        { item, photos: [id] }
      )
    }
  }

  handleDropPhoto = ({ id, to, offset }) => {
    const { onSort, photos } = this.props

    const item = photos[0].item
    const order = move(photos.map(photo => photo.id), id, to, offset)

    onSort({ item, photos: order })
  }

  handleSelect = (photos, meta) => {
    let { item, notes, selection } = photos.at(-1) || {}

    this.props.onSelect({
      photos: photos.map(photo => photo.id),
      item,
      selection,
      note: notes?.[0]
    }, meta)
  }


  handleNextPhoto = (event) => {
    this.container.current?.select(this.container.current?.next(), event)
  }

  handlePrevPhoto = (event) => {
    this.container.current?.select(this.container.current?.prev(), event)
  }

  handleRotate = (by) => {
    if (this.props.selection != null)
      this.rotate(by, this.props.selection, 'selection')
    else
      this.rotate(by, this.props.selectedPhotos.at(-1))
  }

  getAdjacent = (photo) => {
    return adjacent(this.props.photos, photo).map(p => p?.id)
  }

  getIterableProps(photo) {
    return {
      photo,
      cache: this.props.cache,
      selection: this.props.selection,
      isDisabled: this.props.isDisabled,
      isExpandable: this.isExpandable(photo),
      isItemOpen: this.props.isItemOpen,
      isRangeSelected: this.props.selectedPhotos.length > 1,
      isSortable: this.isSortable,
      isVertical: this.isVertical,
      getAdjacent: this.getAdjacent,
      onContextMenu: this.props.onContextMenu,
      onContract: this.contract,
      onDropPhoto: this.handleDropPhoto,
      onConsolidate: this.props.onConsolidate,
      onError: this.props.onError,
      onExpand: this.expand,
      onItemOpen: this.handleItemOpen
    }
  }

  preview({ id, item }) {
    this.props.onItemPreview({ id: item, photos: [id] })
  }

  rotate(by, id, type = 'photo') {
    if (!this.props.isDisabled && id != null) {
      this.props.onRotate({ id, by, type })
    }
  }

  connect(element) {
    return this.props.isDisabled ?
      element :
      this.props.connectDropTarget(element)
  }


  static asDropTarget() {
    return DropTarget(
        [DND.PHOTO, DND.FILE, DND.URL],
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
    selectedPhotos: arrayOf(number).isRequired,
    expandedPhotos: object.isRequired,
    keymap: object.isRequired,
    selection: number,
    selections: object.isRequired,
    size: number.isRequired,

    canCreate: bool,
    isItemOpen: bool,
    isDisabled: bool,
    isOver: bool,
    isOverFile: bool,

    connectDropTarget: func.isRequired,

    onBlur: func.isRequired,
    onConsolidate: func.isRequired,
    onContract: func.isRequired,
    onContextMenu: func.isRequired,
    onCreate: func.isRequired,
    onDelete: func.isRequired,
    onExpand: func.isRequired,
    onError: func.isRequired,
    onTabFocus: func.isRequired,
    onItemOpen: func.isRequired,
    onItemPreview: func.isRequired,
    onRotate: func.isRequired,
    onSelect: func.isRequired,
    onSort: func.isRequired,
    onSelectionSort: func.isRequired
  }

  static defaultProps = {
    expanded: [],
    onBlur: noop
  }

  static getPropKeys() {
    return Object.keys(this.propTypes || this.DecoratedComponent.propTypes)
  }
}

const DropTargetSpec = {
  drop({ photos, onCreate }, monitor) {
    if (monitor.didDrop())
      return

    switch (monitor.getItemType()) {
      case DND.PHOTO: {
        let item = monitor.getItem()
        let to = photos.at(-1).id

        if (item.id !== to)  {
          return {
            id: item.id,
            to,
            offset: 1
          }
        }
        break
      }
      case DND.FILE:
      case DND.URL: {
        let files = getDroppedFiles(monitor)
        if (files) {
          onCreate(files)
          return files
        }
        break
      }
    }
  },

  canDrop({ canCreate, photos }, monitor) {
    switch (monitor.getItemType()) {
      case DND.PHOTO:
        return photos.length > 1
      case DND.FILE:
        return canCreate && hasPhotoFiles(monitor)
      case DND.URL:
        return canCreate
      default:
        return false
    }
  }
}

const DropTargetCollect = (connect, monitor) => {
  let isOver = monitor.isOver({ shallow: true }) && monitor.canDrop()
  let type = monitor.getItemType()

  return {
    connectDropTarget: connect.dropTarget(),
    isOver: isOver && type === DND.PHOTO,
    isOverFile: isOver &&
      (type === DND.FILE || type === DND.URL)
  }
}
