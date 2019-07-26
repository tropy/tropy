'use strict'

const React = require('react')
const { Photo } = require('./photo')
const { arrayOf, bool, object, shape } = require('prop-types')

const Item = ({ item, ...props }) => (
  item.photos.map(photo =>
    <Photo {...props} key={photo.id} item={item} photo={photo}/>)
)

Item.propTypes = {
  canOverflow: bool,
  hasMetadata: bool,
  hasNotes: bool,
  item: shape({
    photos: arrayOf(object).isRequired
  }).isRequired,
}

module.exports = {
  Item
}
