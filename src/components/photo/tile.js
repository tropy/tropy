'use strict'

const React = require('react')
const { Component, PropTypes } = React
const { Thumbnail } = require('./thumbnail')
const dnd = require('./dnd')


// eslint-disable-next-line
class PhotoTile extends Component {

  render() {
    const { photo, cache } = this.props

    return (
      <li>
        <Thumbnail photo={photo} cache={cache} size={64}/>
      </li>
    )
  }

  static propTypes = {
    photo: PropTypes.shape({
      id: PropTypes.number.isRequired
    }).isRequired,

    cache: PropTypes.string,

    isSelected: PropTypes.bool,
    isDisabled: PropTypes.bool,
    isDragging: PropTypes.bool,
    isOver: PropTypes.bool,

    ds: PropTypes.func.isRequired,
    dp: PropTypes.func.isRequired,
    dt: PropTypes.func.isRequired,

    onClick: PropTypes.func,
    onDoubleClick: PropTypes.func
  }
}


module.exports = {
  PhotoTile: dnd.wrap(PhotoTile)
}
