'use strict'

const { createSelector: memo } = require('reselect')
const { seq, compose, map, cat, keep } = require('transducers.js')
const { getSelectedItems } = require('./items')

const getPhotos = ({ photos }) => photos

const getSelectedPhoto = memo(
  getPhotos,
  ({ nav }) => nav.photo,
  (photos, id) => (id != null) ? photos[id] : null
)

const getVisiblePhotos = memo(
  getPhotos,
  getSelectedItems,

  (photos, items) => {
    let k = 0
    let idx = {}
    let lst = seq(items, compose(
      map(item => item.photos),
      cat,
      map(id => photos[id]),
      keep(),
      map(photo => (idx[photo.id] = k++, photo))
    ))

    lst.idx = idx
    return lst
  }
)

module.exports = {
  getSelectedPhoto,
  getVisiblePhotos
}
