'use strict'

const { createSelector: memo } = require('reselect')
const { getSelectedItems } = require('./items')
const { blank } = require('../common/util')
const {
  seq, compose, filter, into, map, cat, keep
} = require('transducers.js')


const withErrors = ([, photo]) =>
  !!photo.broken && !photo.consolidated

const notConsolidating = ([, photo]) =>
  !photo.consolidating

const toId = ([id]) => Number(id)
const toPhoto = ([, photo]) => photo


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

const getPhotosWithErrors = memo(
  getPhotos,
  (photos) =>
    into([], compose(
      filter(withErrors),
      filter(notConsolidating),
      map(toId)
    ), photos))

const getPhotosForConsolidation =
  ({ photos }, ids) =>
    blank(ids) ?
      into([],
        compose(
          filter(notConsolidating),
          map(toPhoto)
        ), photos) :
      seq(ids,
        compose(
          map(id => photos[id]),
          filter(photo => !photo.consolidating)))


module.exports = {
  getPhotosWithErrors,
  getPhotosForConsolidation,
  getSelectedPhoto,
  getVisiblePhotos
}
