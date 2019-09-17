'use strict'

const React = require('react')
const { Thumbnail } = require('../photo')
const { TagColors } = require('../colors')
const { pick, get } = require('../../common/util')
const { Rotation } = require('../../common/iiif')
const { arrayOf, number, object, shape } = require('prop-types')

const StackLines = ({ count }) => (
  (count > 1) && (
    <div className="stack-lines">
      <div className="line line-2"/>
      <div className="line line-1"/>
    </div>
  ))

StackLines.propTypes = {
  isStack: number
}

class CoverImage extends React.PureComponent {
  get id() {
    return this.props.item.cover || this.props.item.photos[0]
  }

  get photo() {
    return get(this.props.photos, [this.id]) || {}
  }

  get orientation() {
    let { photo } = this

    return Rotation
      .fromExifOrientation(photo.orientation)
      .add(photo)
      .mode(photo)
  }

  render() {
    return (
      <div className={`cover-image ${this.orientation}`}>
        <StackLines
          count={this.props.item.photos.length}/>
        <Thumbnail
          {...pick(this.props, Thumbnail.keys)}
          {...pick(this.photo, Thumbnail.keys)}
          id={this.id}/>
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
      photos: arrayOf(number).isRequired,
      tags: arrayOf(number),
      cover: number
    }).isRequired
  }
}

module.exports = {
  CoverImage
}
