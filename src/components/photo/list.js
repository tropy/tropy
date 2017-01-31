'use strict'

const React = require('react')
const { PropTypes } = React
const { PhotoListItem } = require('./list-item')
const { PhotoIterator } = require('./iterator')
const { DC } = require('../../constants/properties')
const { get } = require('../../common/util')


class PhotoList extends PhotoIterator {

  isEditing(photo) {
    return get(this.props, 'ui.edit.photo') === photo.id
  }


  handleDoubleClick = (photo) => {
    const { isOpen, onOpen } = this.props

    if (!isOpen) {
      onOpen({ id: photo.item, photos: [photo.id] })
    }
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
            onClick={this.select}
            onSingleClick={onEdit}
            onDoubleClick={this.open}
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
