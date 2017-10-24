'use strict'

const { createSelector: memo } = require('reselect')
const { getSelectedItems } = require('./items')
const {
  seq, compose, filter, into, map, cat, keep
} = require('transducers.js')

const getPhotos = ({ photos }) => photos

const withErrors = ([, photo]) => (!!photo.broken && !photo.consolidated)
const toId = ([id]) => Number(id)

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

const getPhotosWithErrors = memo(
  getPhotos,
  (photos) =>
    into([], compose(filter(withErrors), map(toId)), photos))

module.exports = {
  getPhotosWithErrors,
  getSelectedPhoto,
  getVisiblePhotos
}
