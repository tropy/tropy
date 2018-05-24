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
    return ['photo-list', super.classes]
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

  next(offset = 1) {
    if (!(offset === 1 || offset === -1)) {
      return super.next(offset)
    }

    const photo = super.next(0)
    if (!this.isExpanded(photo)) {
      return this.getPhotoBackwards(super.next(offset), offset)
    }

    let { selection } = this.props
    const idx = photo.selections.indexOf(selection)

    if (offset > 0) {
      if (idx + offset >= photo.selections.length) {
        return super.next(offset)
      }
    } else {
      if (idx === 0) return photo
      if (idx < 0) {
        return this.getPhotoBackwards(super.next(offset), offset)
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

  current() {
    const photo = super.next(0)
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

  // eslint-disable-next-line complexity
  handleKeyDown = (event) => {
    switch (match(this.keymap, event)) {
      case 'up':
        this.handlePrevPhoto(event)
        break
      case 'down':
        this.handleNextPhoto(event)
        break
      case 'home':
        this.scroll(0)
        break
      case 'end':
        this.scrollToEnd()
        break
      case 'pageUp':
        this.scrollPageUp()
        break
      case 'pageDown':
        this.scrollPageDown()
        break
      case 'left':
      case 'contract':
        this.contract(this.current())
        break
      case 'right':
      case 'expand':
        this.expand(this.current())
        break
      case 'edit':
      case 'enter':
        this.edit(this.current())
        break
      case 'open':
        this.handleItemOpen(this.current())
        break
      case 'preview':
        this.preview(this.current())
        break
      case 'delete':
        this.handleDelete(this.current())
        this.select(this.next() || this.prev())
        break
      default:
        return
    }

    event.preventDefault()
    event.stopPropagation()
    event.nativeEvent.stopImmediatePropagation()
  }


  render() {
    const { data, edit, onBlur, onChange } = this.props
    const { height } = this.state
    const { transform } = this

    return this.connect(
      <div className={cx(this.classes)}>
        <div
          className="scroll-container"
          ref={this.setContainer}
          tabIndex={this.tabIndex}
          onBlur={onBlur}
          onKeyDown={this.handleKeyDown}>
          <div className="runway" style={{ height }}>
            <ul className="viewport" style={{ transform }}>
              {this.mapIterableRange(({ photo, ...props }) =>
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
          </div>
        </div>
      </div>
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
