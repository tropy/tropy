'use strict'

const getPhotos = ({ photos }, props) =>
  props.photos.map(id => photos[id])

module.exports = {
  getPhotos
}
