'use strict'

const React = require('react')
const { Component, PropTypes } = React
const { PhotoListItem } = require('./list-item')
const { DC } = require('../../constants/properties')


class PhotoList extends Component {

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

  render() {
    const { photos, selected, onEdit, ...props } = this.props

    return (
      <ul className="photo-list">
        {photos.map(photo =>
          <PhotoListItem {...props}
            key={photo}
            id={photo}
            isSelected={photo === selected}
            title={DC.TITLE}
            onClick={this.handleClick}
            onSingleClick={onEdit}
            onDoubleClick={this.handleDoubleClick}
            onContextMenu={this.handleContextMenu}/>
        )}
      </ul>
    )
  }

  static propTypes = {
    photos: PropTypes.arrayOf(PropTypes.number),
    selected: PropTypes.number,

    isDisabled: PropTypes.bool,
    isOpen: PropTypes.bool,

    onSelect: PropTypes.func,
    onOpen: PropTypes.func,
    onEdit: PropTypes.func,
    onCancel: PropTypes.func,
    onContextMenu: PropTypes.func
  }
}

module.exports = {
  PhotoList
}
