'use strict'

const React = require('react')
const { Thumbnail } = require('../photo')
const { TagColors } = require('../colors')
const { pick, get } = require('../../common/util')
const { arrayOf, bool, number, object, shape } = require('prop-types')

const ThumbProps = Object.keys(Thumbnail.propTypes)

const StackLines = ({ isStack }) => isStack && (
  <div className="stack-lines">
    <div className="line line-2"/>
    <div className="line line-1"/>
  </div>
)

StackLines.propTypes = {
  isStack: bool
}

class CoverImage extends React.PureComponent {
  get isStack() {
    return this.props.item.photos.length > 1
  }

  get cover() {
    return this.props.item.cover || this.props.item.photos[0]
  }

  getPhotoProps() {
    return pick(get(this.props.photos, [this.cover]), [
      'angle', 'consolidated', 'mirror', 'mimetype', 'orientation', 'broken', 'width', 'height'
    ])
  }

  render() {
    return (
      <div className="cover-image">
        <StackLines isStack={this.isStack}/>
        <Thumbnail {...pick(this.props, ThumbProps)}
          id={this.cover}
          {...this.getPhotoProps()}
          onLoad={this.props.onLoad}
          onError={this.props.onError}/>
        <TagColors
          selection={this.props.item.tags}
          tags={this.props.tags}/>
      </div>
    )
  }

  static propTypes = {
    ...Thumbnail.propTypes,
    tags: object,
    photos: object,
    item: shape({
      photos: arrayOf(number),
      tags: arrayOf(number),
      cover: number
    }).isRequired
  }
}

module.exports = {
  CoverImage
}
