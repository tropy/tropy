'use strict'

const {
  createSelector: memo
} = require('reselect')

const { seq, compose, map, mapcat } = require('transducers.js')
const { get } = require('../common/util')


const collect = (photos, metadata, id) => {
  if (id == null) return null
  return {
    id, ...photos[id], data: { id, ...metadata[id] }
  }
}

const getPhotos = memo(
  ({ photos }) => photos,
  ({ metadata }) => metadata,
  ({ items }) => items,
  ({ nav }) => nav.items,

  (photos, metadata, items, selection) =>
    seq(selection, compose(
      mapcat(id => get(items, [id, 'photos']) || []),
      map(id => collect(photos, metadata, id))
    )))

const getSelectedPhoto = memo(
  ({ photos }) => photos,
  ({ metadata }) => metadata,
  ({ nav }) => nav.photo,
  collect)

module.exports = {
  getSelectedPhoto,
  getPhotos
}
