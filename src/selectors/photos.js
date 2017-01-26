'use strict'

const {
  createSelector: memo
} = require('reselect')

const collect = (photos, metadata, id) => {
  if (id == null) return null
  return {
    id, ...photos[id], data: { id, ...metadata[id] }
  }
}


const getPhotos = ({ photos }, { ids }) =>
  ids.map(id => photos[id] || { id })


const getSelectedPhoto = memo(
  ({ photos }) => photos,
  ({ metadata }) => metadata,
  ({ nav }) => nav.photo,
  collect)

module.exports = {
  getSelectedPhoto,
  getPhotos
}
