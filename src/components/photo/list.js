'use strict'

const React = require('react')
const { object, func } = require('prop-types')
const { PhotoListItem } = require('./list-item')
const { PhotoIterator } = require('./iterator')
const { DC, SASS: { ROW } } = require('../../constants')
const cx = require('classnames')
const { match } = require('../../keymap')
const { get } = require('../../common/util')


class PhotoList extends PhotoIterator {
  get classes() {
    return ['list', super.classes]
  }

  getColumns() {
    return 1
  }

  getRowHeight() {
    return ROW.HEIGHT
  }

  isEditing(photo) {
    return this.props.edit.photo === photo.id
  }

  getNext(offset = 1) {
    if (!(offset === 1 || offset === -1)) {
      return super.getNext(offset)
    }

    const photo = super.getNext(0)
    if (!this.isExpanded(photo)) {
      return this.getPhotoBackwards(super.getNext(offset), offset)
    }

    let { selection } = this.props
    const idx = photo.selections.indexOf(selection)

    if (offset > 0) {
      if (idx + offset >= photo.selections.length) {
        return super.getNext(offset)
      }
    } else {
      if (idx === 0) return photo
      if (idx < 0) {
        return this.getPhotoBackwards(super.getNext(offset), offset)
      }
    }

    selection = photo.selections[idx + offset]

    const notes = (selection != null) ?
      get(this.props.selections, [selection, 'notes'], []) :
      photo.notes

    return {
      ...photo,
      selection,
      notes
    }
  }

  getCurrent() {
    const photo = super.getNext(0)
    if (!this.isExpanded(photo)) return photo

    const { selection } = this.props
    if (!photo.selections.includes(selection)) return photo

    return {
      ...photo,
      selection
    }
  }

  getPhotoBackwards(photo, offset) {
    if (offset >= 0 || !this.isExpanded(photo)) return photo

    return {
      ...photo,
      selection: photo.selections[photo.selections.length - 1]
    }
  }

  edit = (photo) => {
    if (photo != null && !this.props.isDisabled) {
      const { id, selection } = photo

      if (selection == null) {
        this.props.onEdit({ photo: id })
      } else {
        this.props.onEdit({ selection })
      }
    }
  }

  handleEditCancel = (...args) => {
    this.props.onEditCancel(...args)
    this.container.focus()
  }

  handleKeyDown = (event) => {
    switch (match(this.keymap, event)) {
      case 'up':
        this.select(this.getPrev())
        break
      case 'down':
        this.select(this.getNext())
        break
      case 'left':
      case 'contract':
        this.contract(this.getCurrent())
        break
      case 'right':
      case 'expand':
        this.expand(this.getCurrent())
        break
      case 'edit':
      case 'enter':
        this.edit(this.getCurrent())
        break
      case 'open':
        this.handleItemOpen(this.getCurrent())
        break
      case 'delete':
        this.handleDelete(this.getCurrent())
        this.select(this.getNext() || this.getPrev())
        break
      default:
        return
    }

    event.preventDefault()
    event.stopPropagation()
  }


  render() {
    const { data, edit, onChange } = this.props

    return this.connect(
      <ul
        className={cx(this.classes)}
        ref={this.setContainer}
        tabIndex={this.tabIndex}
        onKeyDown={this.handleKeyDown}>
        {this.map(({ photo, ...props }) =>
          <PhotoListItem {...props}
            key={photo.id}
            photo={photo}
            data={data}
            edit={edit}
            selections={this.props.selections}
            title={DC.title}
            isEditing={this.isEditing(photo)}
            onChange={onChange}
            onEdit={this.edit}
            onEditCancel={this.handleEditCancel}
            onSelectionSort={this.props.onSelectionSort}/>)}
      </ul>
    )
  }

  static propTypes = {
    ...PhotoIterator.propTypes,
    edit: object.isRequired,
    data: object.isRequired,
    onChange: func.isRequired,
    onEdit: func.isRequired,
    onEditCancel: func.isRequired
  }
}


module.exports = {
  PhotoList: PhotoList.asDropTarget()
}
