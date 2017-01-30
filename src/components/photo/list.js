'use strict'

const React = require('react')
const { Component, PropTypes } = React
const { PhotoListItem } = require('./list-item')
const { DC } = require('../../constants/properties')
const { get, move } = require('../../common/util')


class PhotoList extends Component {

  isSelected(photo) {
    return this.props.selected === photo.id
  }

  isEditing(photo) {
    return get(this.props, 'ui.edit.photo') === photo.id
  }

  isContext(photo) {
    return get(this.props, 'ui.context.photo') === photo.id
  }

  handleContextMenu = (photo, event) => {
    this.props.onContextMenu(event, 'photo', photo)
  }

  handleClick = (photo, event) => {
    const { selected, onSelect } = this.props

    if (selected !== photo.id) {
      onSelect({
        photo: photo.id,
        item: photo.item
      })

      event.stopPropagation()
    }
  }

  handleDoubleClick = (photo) => {
    const { isOpen, onOpen } = this.props

    if (!isOpen) {
      onOpen({ id: photo.item, photos: [photo.id] })
    }
  }

  handleDropPhoto = ({ id, to, offset }) => {
    const { onSort, photos } = this.props

    const item = photos[0].item
    const order = move(photos.map(photo => photo.id), id, to, offset)

    onSort({ item, photos: order })
  }

  render() {
    const { photos, onEdit, ...props } = this.props

    return (
      <ul className="photo-list">
        {photos.map(photo =>
          <PhotoListItem {...props}
            key={photo.id}
            photo={photo}
            isSelected={this.isSelected(photo)}
            isEditing={this.isEditing(photo)}
            isContext={this.isContext(photo)}
            title={DC.TITLE}
            onClick={this.handleClick}
            onSingleClick={onEdit}
            onDoubleClick={this.handleDoubleClick}
            onDropPhoto={this.handleDropPhoto}
            onContextMenu={this.handleContextMenu}/>
        )}
      </ul>
    )
  }

  static propTypes = {
    photos: PropTypes.arrayOf(
      PropTypes.shape({
        id: PropTypes.number.isRequired
      })
    ),

    cache: PropTypes.string,
    selected: PropTypes.number,

    isDisabled: PropTypes.bool,
    isOpen: PropTypes.bool,

    onSelect: PropTypes.func,
    onSort: PropTypes.func,
    onOpen: PropTypes.func,
    onEdit: PropTypes.func,
    onCancel: PropTypes.func,
    onContextMenu: PropTypes.func
  }
}

module.exports = {
  PhotoList
}
