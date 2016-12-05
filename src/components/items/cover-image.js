'use strict'

const React = require('react')
const { Component, PropTypes } = React
const { IconItem } = require('../icons')
const { imageURL } = require('../../common/cache')

class CoverImage extends Component {

  get empty() {
    const { item } = this.props
    return !item.photos || !item.photos.length
  }

  get src() {
    const { item: { cover, photos }, cache, size } = this.props
    const csize = size > 48 ? 512 : 48

    switch (true) {
      case !!(cover):
        return imageURL(cache, cover, csize)
      case !!(photos.length):
        return imageURL(cache, photos[0], csize)
    }
  }

  get style() {
    return {
      width: `${this.props.size}px`,
      height: `${this.props.size}px`
    }
  }

  render() {
    return (
      <figure className="cover-image" style={this.style}>
        {this.empty ?
          <IconItem/> :
          <img srcSet={`${encodeURI(this.src)} 2x`}/>
        }
      </figure>
    )
  }

  static propTypes = {
    item: PropTypes.shape({
      id: PropTypes.number.isRequired,
      photos: PropTypes.arrayOf(PropTypes.number),
      cover: PropTypes.number
    }).isRequired,

    size: PropTypes.number.isRequired,
    cache: PropTypes.string.isRequired
  }
}

module.exports = {
  CoverImage
}
