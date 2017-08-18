'use strict'

const React = require('react')
const { object, func } = require('prop-types')
const { PhotoListItem } = require('./list-item')
const { PhotoIterator } = require('./iterator')
const { DC } = require('../../constants')
const { on, off } = require('../../dom')
const cx = require('classnames')
const { match } = require('../../keymap')


class PhotoList extends PhotoIterator {
  componentDidMount() {
    on(this.container, 'tab:focus', this.handleFocus)
  }

  componentWillUnmount() {
    off(this.container, 'tab:focus', this.handleFocus)
  }

  get classes() {
    return {
      ...super.classes,
      'photo': true,
      'list': true,
      'click-catcher': true
    }
  }

  isEditing(photo) {
    return this.props.edit.photo === photo.id
  }

  getNextPhoto(offset = 1) {
    if (!(offset === 1 || offset === -1)) {
      return super.getNextPhoto(offset)
    }

    const photo = super.getNextPhoto(0)
    if (!this.isExpanded(photo)) {
      return this.preselect(super.getNextPhoto(offset), offset)
    }

    const { selection } = this.props
    const idx = photo.selections.indexOf(selection)

    if (offset > 0) {
      if (idx + offset >= photo.selections.length) {
        return super.getNextPhoto(offset)
      }
    } else {
      if (idx === 0) return photo
      if (idx < 0) {
        return this.preselect(super.getNextPhoto(offset), offset)
      }
    }

    return {
      ...photo,
      selection: photo.selections[idx + offset]
    }
  }

  getCurrentPhoto() {
    const photo = super.getNextPhoto(0)
    if (!this.isExpanded(photo)) return photo

    const { selection } = this.props
    if (!photo.selections.includes(selection)) return photo

    return {
      ...photo,
      selection
    }
  }

  preselect(photo, offset) {
    if (offset >= 0 || !this.isExpanded(photo)) return photo

    return {
      ...photo,
      selection: photo.selections[photo.selections.length - 1]
    }
  }

  handleEditCancel = (...args) => {
    this.props.onEditCancel(...args)
    this.container.focus()
  }

  handleKeyDown = (event) => {
    switch (match(this.props.keymap, event)) {
      case 'up':
        this.select(this.getPrevPhoto())
        break
      case 'down':
        this.select(this.getNextPhoto())
        break
      case 'left':
      case 'contract':
        this.contract(this.getCurrentPhoto())
        break
      case 'right':
      case 'expand':
        this.expand(this.getCurrentPhoto())
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


  render() {
    const { data, edit, onChange, onEdit } = this.props

    return this.connect(
      <ul
        className={cx(this.classes)}
        ref={this.setContainer}
        tabIndex={this.tabIndex}
        onKeyDown={this.handleKeyDown}
        onClick={this.handleClickOutside}>
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
            onEdit={onEdit}
            onEditCancel={this.handleEditCancel}/>)}
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
  PhotoList: PhotoList.wrap()
}
