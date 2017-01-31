'use strict'

const React = require('react')
const { Component, PropTypes } = React
const { PhotoTile } = require('./tile')
const { move } = require('../../common/util')


class PhotoGrid extends Component {

  isSelected(photo) {
    return this.props.selected === photo.id
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
    const { photos, ...props } = this.props

    return (
      <ul className="photo-grid">
        {photos.map(photo =>
          <PhotoTile {...props}
            key={photo.id}
            photo={photo}
            isSelected={this.isSelected(photo)}
            onContextMenu={this.handleContextMenu}/>)
        }
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
    onContextMenu: PropTypes.func
  }
}

module.exports = {
  PhotoGrid
}
