'use strict'

const React = require('react')
const { PureComponent } = React
const { Thumbnail } = require('../photo')
const { TagColors } = require('../colors')
const { pick, get } = require('../../common/util')
const { arrayOf, number, object, shape } = require('prop-types')

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

  get hasTags() {
    return this.props.tags != null && this.props.item.tags.length > 0
  }

  get cover() {
    return this.props.item.cover || get(this.props.item.photos, [0])
  }

  getPhotoProps() {
    return pick(get(this.props.photos, [this.cover]), [
      'angle', 'mirror', 'orientation', 'broken'
    ])
  }

  render() {
    return (
      <div className="cover-image">
        {this.isStack && stack }
        <Thumbnail {...pick(this.props, ThumbProps)}
          id={this.cover}
          {...this.getPhotoProps()}/>
        {this.hasTags &&
          <TagColors
            selection={this.props.item.tags}
            tags={this.props.tags}/>}
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
    }).isRequired,
  }
}

module.exports = {
  CoverImage
}
