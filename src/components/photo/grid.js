'use strict'

const React = require('react')
const { PropTypes } = React
const { PhotoIterator } = require('./iterator')
const { PhotoTile } = require('./tile')


class PhotoGrid extends PhotoIterator {

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
