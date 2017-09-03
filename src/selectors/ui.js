'use strict'

const { createSelector: memo } = require('reselect')
const { getVisiblePhotos } = require('./photos')
const { seq, compose, map, keep } = require('transducers.js')
const BLANK = {}

const getActiveImageProps = memo(
  ({ ui }) => ui.image,
  ({ nav }) => nav.photo,
  ({ nav }) => nav.selection,
  (image, photo, selection) => image[selection || photo] || BLANK
)

const getExpandedPhotos = memo(
  ({ ui }) => ui.expand,
  getVisiblePhotos,
  (expand, photos) =>
    seq(photos, compose(
      map(photo => expand[photo.id] > 0 ? photo.id : null),
      keep()
    ))
)

module.exports = {
  getActiveImageProps,
  getExpandedPhotos
}
