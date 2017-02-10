'use strict'

const { createSelector: memo } = require('reselect')
const { seq, compose, map, mapcat, keep } = require('transducers.js')
const { get } = require('../common/util')

const getPhotos = ({ photos }) => photos

const getVisiblePhotos = memo(
  getPhotos,
  ({ items }) => (items),
  ({ nav }) => (nav.items),

  (photos, items, selection) =>
    seq(selection, compose(
      mapcat(id => get(items, [id, 'photos']) || []),
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
