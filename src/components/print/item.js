'use strict'

const React = require('react')
const { Photo } = require('./photo')
const { arrayOf, bool, object, shape, string } = require('prop-types')

const Item = ({ item, hasOnlyNotes, ...props }) => (
  item.photos.map(photo =>
    (hasOnlyNotes && !photo.notes?.length) ?
      null :
      <Photo {...props} key={photo.id} item={item} photo={photo}/>)
)

Item.propTypes = {
  canOverflow: bool,
  hasPhotos: bool,
  hasMetadata: bool,
  hasNotes: bool,
  hasOnlyNotes: bool,
  cache: string,
  item: shape({
    photos: arrayOf(object).isRequired
  }).isRequired
}

module.exports = {
  Item
}
