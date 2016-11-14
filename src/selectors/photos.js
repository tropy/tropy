'use strict'

const getPhotos = ({ photos }, props) =>
  props.photos.map(id => photos[id] || { id })

module.exports = {
  getPhotos
}
