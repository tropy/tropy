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

  handleSingleClick = () => {
    // edit
  }

  handleDoubleClick = () => {
    // open
  }

  render() {
    const { photos, selected, ...props } = this.props

    return (
      <ul className="photo-list">
        {photos.map(photo =>
          <PhotoListItem {...props}
            key={photo}
            id={photo}
            isSelected={photo === selected}
            title={DC.TITLE}
            onClick={this.handleClick}
            onSingelClick={this.handleSingleClick}
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

    onSelect: PropTypes.func,
    onOpen: PropTypes.func,
    onCancel: PropTypes.func,
    onContextMenu: PropTypes.func
  }
}

module.exports = {
  PhotoList
}
