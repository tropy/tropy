'use strict'

const { createSelector: memo } = require('reselect')
const { seq, compose, map, cat, keep, take } = require('transducers.js')
const { getSelectedItems } = require('./items')
const { MAX_SELECT } = require('../constants')

const getPhotos = ({ photos }) => photos

const getSelectedPhoto = memo(
  getPhotos,
  ({ nav }) => nav.photo,
  (photos, id) => (id != null) ? photos[id] : null
)

const getVisiblePhotos = memo(
  getPhotos,
  getSelectedItems,

  (photos, items) =>
    seq(items, compose(
      map(item => item.photos),
      cat,
      map(id => photos[id]),
      keep(),
      take(MAX_SELECT)
    ))
)

module.exports = {
  getSelectedPhoto,
  getVisiblePhotos
}
