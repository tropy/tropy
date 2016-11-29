'use strict'

const getPhotos = ({ photos }, { ids }) =>
  ids.map(id => photos[id] || { id })

module.exports = {
  getPhotos
}
