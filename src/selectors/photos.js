'use strict'

const { createSelector: memo } = require('reselect')

const getPhotos = ({ photos }, { ids }) =>
  ids.map(id => photos[id] || { id })

const getSelectedPhoto = memo(
  state => state.photos,
  state => state.nav.photo,
  (photos, id) => photos && id && photos[id]
)

module.exports = {
  getSelectedPhoto,
  getPhotos
}
