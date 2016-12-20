'use strict'

const React = require('react')
const { Component, PropTypes } = React
const { IconItem } = require('../icons')
const { imageURL } = require('../../common/cache')
const { getClickHandler } = require('../util')
const cn = require('classnames')

class CoverImage extends Component {
  constructor(props) {
    super(props)
    this.handleClick = getClickHandler(this)
  }

  get cardinality() {
    const { item } = this.props
    return item && item.photos ? item.photos.length : 0
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
    const { cardinality } = this

    return (
      <figure
        className={cn({ 'cover-image': true, 'stack': cardinality > 1 })}
        style={this.style}
        onClick={this.handleClick}>
        {cardinality === 0
          ? <IconItem/>
          : <img srcSet={`${encodeURI(this.src)} 2x`}/>
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
    cache: PropTypes.string.isRequired,

    onSingleClick: PropTypes.func,
    onDoubleClick: PropTypes.func
  }

}

module.exports = {
  CoverImage
}
