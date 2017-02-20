'use strict'

const { createSelector: memo } = require('reselect')
const { seq, compose, map, cat, keep } = require('transducers.js')
const { getSelectedItems } = require('./items')

const getPhotos = ({ photos }) => photos

const getVisiblePhotos = memo(
  getPhotos,
  getSelectedItems,

  (photos, items) =>
    seq(items, compose(
      map(item => item.photos),
      cat,
      map(id => photos[id]),
      keep()
    ))
)

const getSelectedPhoto = memo(
  getPhotos,
  ({ nav }) => nav.photo,
  (photos, id) => photos[id]
)

module.exports = {
  getSelectedPhoto,
  getVisiblePhotos
}
