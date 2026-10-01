import React from 'react'
import { DND } from '../dnd.js'
import { useDropOutside } from '../../hooks/use-drop-outside.js'
import { useDropPhotoFiles } from '../../hooks/use-drop-photo-files.js'
import { useEvent } from '../../hooks/use-event.js'
import { adjacent, move, noop } from '../../common/util.js'
import { on, off } from '../../dom.js'
import { TABS } from '../../constants/index.js'

export class PhotoIterator extends React.Component {
  container = React.createRef()
  state = {}

  componentDidMount () {
    on(document, 'global:nextPhoto', this.handleNextPhoto)
    on(document, 'global:prevPhoto', this.handlePrevPhoto)
  }

  componentWillUnmount () {
    this.props.onBlur()
    off(document, 'global:nextPhoto', this.handleNextPhoto)
    off(document, 'global:prevPhoto', this.handlePrevPhoto)
  }

  get classes () {
    return {
      over: this.props.isOver,
      'over-file': this.props.isOverFile
    }
  }

  get current () {
    return this.container.current.current
  }

  get tabIndex () {
    return this.props.photos.length > 0 ? TABS[this.constructor.name] : null
  }

  isSelected (photo) {
    return this.props.current === photo.id
  }

  isActive (selection) {
    return this.props.selection === selection
  }

  isExpandable (photo) {
    return photo != null &&
      photo.selections != null && photo.selections.length > 0
  }

  isExpanded (photo) {
    return photo != null &&
      !!this.props.expandedPhotos[photo.id]
  }

  get keymap () {
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

  getIterableProps (photo) {
    return {
      photo,
      selection: this.props.selection,
      isDisabled: this.props.isDisabled,
      isExpandable: this.isExpandable(photo),
      isItemOpen: this.props.isItemOpen,
      isSelected: this.isSelected(photo),
      isVertical: this.isVertical,
      getAdjacent: this.getAdjacent,
      onContextMenu: this.props.onContextMenu,
      onContract: this.contract,
      onDropPhoto: this.props.onDropPhoto,
      onConsolidate: this.props.onConsolidate,
      onExpand: this.expand,
      onItemOpen: this.handleItemOpen,
      onSelect: this.handleSelectPhoto
    }
  }

  preview ({ id, item }) {
    this.props.onItemPreview({ id: item, photos: [id] })
  }

  rotate (by, id, type = 'photo') {
    if (!this.props.isDisabled && id != null) {
      this.props.onRotate({ id, by, type })
    }
  }

  connect (element) {
    return this.props.isDisabled ?
      element :
      this.props.connectDropTarget(element)
  }


  static asDropTarget () {
    let Iterator = this

    return function PhotoIteratorContainer (props) {
      let { canCreate, photos, onCreate, onSort } = props

      let handleDropPhoto = useEvent(({ id, to, offset }) => {
        let item = photos[0].item
        let order = move(photos.map(photo => photo.id), id, to, offset)

        onSort({ item, photos: order })
      })

      let canDropPhoto = useEvent((item) => item.id !== photos.at(-1)?.id)

      let [photo, dropPhoto] = useDropOutside({
        type: DND.PHOTO,
        canDrop: canDropPhoto,
        items: photos.map(p => p.id),
        onDrop: handleDropPhoto
      })

      let [file, dropFile] = useDropPhotoFiles({
        isReadOnly: !canCreate,
        onDrop: onCreate
      })

      return (
        <Iterator
          {...props}
          connectDropTarget={(element) => dropPhoto(dropFile(element))}
          isOver={photo.isOver && photo.canDrop}
          isOverFile={file.isOver && file.canDrop}
          onDropPhoto={handleDropPhoto}/>
      )
    }
  }

  static defaultProps = {
    expanded: [],
    onBlur: noop
  }
}
