'use strict'

const React = require('react')
const { Component, PropTypes } = React
const { PhotoListItem } = require('./list-item')
const { DC } = require('../../constants/properties')


class PhotoList extends Component {

  handleContextMenu = (photo, event) => {
    this.props.onContextMenu(event, 'photo', photo)
  }

  handleSelect = (photo) => {
    const { selected, onSelect } = this.props

    onSelect(selected === photo.id ? null : {
      photo: photo.id,
      item: photo.item
    })
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
            onSelect={this.handleSelect}
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
    onContextMenu: PropTypes.func
  }
}

module.exports = {
  PhotoList
}
