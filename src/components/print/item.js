'use strict'

const React = require('react')
const { Photo } = require('./photo')
const { arrayOf, object, shape } = require('prop-types')

const Item = ({ item }) => (
  item.photos.map(photo =>
    <Photo key={photo.id} item={item} photo={photo}/>)
)

Item.propTypes = {
  item: shape({
    photos: arrayOf(object).isRequired
  }).isRequired,
}

module.exports = {
  Item
}
