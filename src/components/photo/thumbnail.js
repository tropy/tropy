'use strict'

const React = require('react')
const { Component, PropTypes } = React
const { imageURL } = require('../../common/cache')

class Thumbnail extends Component {

  get src() {
    const { cache, photo, size } = this.props
    return imageURL(cache, photo.id, size > 48 ? 512 : 48)
  }

  render() {
    const { size } = this.props

    return (
      <img
        className="thumbnail"
        src={encodeURI(this.src)}
        width={size}
        height={size}/>
    )
  }

  static propTypes = {
    cache: PropTypes.string.isRequired,
    photo: PropTypes.shape({
      id: PropTypes.number.isRequired
    }),
    size: PropTypes.number.isRequired
  }
}


module.exports = {
  Thumbnail
}
