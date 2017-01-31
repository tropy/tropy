'use strict'

const React = require('react')
const { PropTypes } = React
const { PhotoListItem } = require('./list-item')
const { PhotoIterator } = require('./iterator')
const { DC } = require('../../constants/properties')
const { get } = require('../../common/util')


class PhotoList extends PhotoIterator {

  isEditing(photo) {
    return get(this.props.ui, 'edit.photo') === photo.id
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
    ...PhotoIterator.propTypes,

    cache: PropTypes.string,
    isDisabled: PropTypes.bool,

    onEdit: PropTypes.func,
    onCancel: PropTypes.func
  }
}

module.exports = {
  PhotoList
}
