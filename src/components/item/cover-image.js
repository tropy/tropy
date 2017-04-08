'use strict'

const React = require('react')
const { PureComponent } = React
const { PropTypes } = require('prop-types')
const { Thumbnail } = require('../photo')
const { pick, get } = require('../../common/util')
const { shape, number, arrayOf } = PropTypes

const ThumbProps = Object.keys(Thumbnail.propTypes)

const stack = (
  <div className="stack-lines">
    <div className="line line-2"/>
    <div className="line line-1"/>
  </div>
)

class CoverImage extends PureComponent {

  get isStack() {
    const { photos } = this.props.item
    return photos && photos.length > 1
  }

  get cover() {
    return this.props.item.cover || get(this.props.item.photos, [0])
  }

  get orientation() {
    return get(this.props.photos, [this.cover, 'orientation']) || 1
  }

  render() {
    return (
      <div className="cover-image">
        {this.isStack && stack }
        <Thumbnail {...pick(this.props, ThumbProps)}
          id={this.cover}
          orientation={this.orientation}/>
      </div>
    )
  }

  static propTypes = {
    ...Thumbnail.propTypes,
    item: shape({
      photos: arrayOf(number),
      cover: number
    }).isRequired,
  }
}

module.exports = {
  CoverImage
}
