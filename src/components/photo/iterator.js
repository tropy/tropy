import React from 'react'
import { DND, DropTarget, getDroppedFiles, hasPhotoFiles } from '../dnd.js'
import { adjacent, move, noop } from '../../common/util.js'
import { on, off } from '../../dom.js'
import { TABS } from '../../constants/index.js'

export class PhotoIterator extends React.Component {
  container = React.createRef()
  state = {}

  componentDidMount() {
    on(document, 'global:nextPhoto', this.handleNextPhoto)
    on(document, 'global:prevPhoto', this.handlePrevPhoto)
  }

  componentWillUnmount() {
    this.props.onBlur()
    off(document, 'global:nextPhoto', this.handleNextPhoto)
    off(document, 'global:prevPhoto', this.handlePrevPhoto)
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
      !!this.props.expandedPhotos[photo.id]
  }

  get keymap() {
    return this.props.keymap.PhotoIterator
  }

  select = (photo, { throttle } = {}) => {
    if (photo == null || (
      this.isSelected(photo) && this.isActive(photo.selection)
    )) {
      return
    }

    this.props.onSelect({
      photo: photo.id,
      item: photo.item,
      selection: photo.selection
    }, { throttle })
  }

  contract = (photo) => {
    if (this.isExpandable(photo) && this.isExpanded(photo)) {
      this.props.onContract([photo.id])

      if (this.isSelected(photo)) {
        this.props.onSelect({
          photo: photo.id,
          item: photo.item
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
      photos: [photo.id],
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

  handleExtract = ({ id, selection }, meta = {}) => {
    this.props.onExtract({ id, selection }, meta)
  }

  handleSelectPhoto = (photo, event) => {
    this.select(photo, { throttle: event?.repeat })
  }

  handleNextPhoto = (event) => {
    this.handleSelectPhoto(this.container.current?.next(), event)
  }

  handlePrevPhoto = (event) => {
    this.handleSelectPhoto(this.container.current?.prev(), event)
  }

  handleRotate = (by) => {
    if (this.props.selection != null)
      this.rotate(by, this.props.selection, 'selection')
    else
      this.rotate(by, this.props.current)
  }

  getAdjacent = (photo) => {
    return adjacent(this.props.photos, photo).map(p => p?.id)
  }

  getIterableProps(photo) {
    return {
      photo,
      selection: this.props.selection,
      isDisabled: this.props.isDisabled,
      isExpandable: this.isExpandable(photo),
      isItemOpen: this.props.isItemOpen,
      isSelected: this.isSelected(photo),
      isSortable: this.isSortable,
      isVertical: this.isVertical,
      getAdjacent: this.getAdjacent,
      onContextMenu: this.props.onContextMenu,
      onContract: this.contract,
      onDropPhoto: this.handleDropPhoto,
      onConsolidate: this.props.onConsolidate,
      onExpand: this.expand,
      onItemOpen: this.handleItemOpen,
      onSelect: this.handleSelectPhoto
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

  static defaultProps = {
    expanded: [],
    onBlur: noop
  }
}

const DropTargetSpec = {
  drop({ photos, onCreate }, monitor) {
    if (monitor.didDrop())
      return

    let item = monitor.getItem()

    switch (monitor.getItemType()) {
      case DND.PHOTO: {
        let to = photos.at(-1).id

        if (item.id !== to) {
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
        let files = getDroppedFiles(item)
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
        return canCreate && hasPhotoFiles(monitor.getItem())
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
