'use strict'

const { createSelector: memo } = require('reselect')
const { getVisiblePhotos } = require('./photos')
const { seq, compose, map, keep } = require('transducers.js')
const { get } = require('../common/util')
const BLANK = {}

const rev = (a, b) => a < b ? 1 : b < a ? -1 : 0

const getActiveImageProps = memo(
  ({ ui }) => ui.image,
  ({ nav }) => nav.photo,
  ({ nav }) => nav.selection,
  (image, photo, selection) => get(image, [selection || photo]) || BLANK
)

const getExpandedPhotos = memo(
  ({ ui }) => ui.expand,
  ({ ui }) => ui.panel.zoom > 0,
  getVisiblePhotos,
  (expand, isGrid, photos) => {
    const expanded = seq(photos, compose(
      map(photo => expand[photo.id] > 0 ? photo.id : null),
      keep()
    ))

    if (isGrid) {
      expanded.sort((a, b) => rev(expand[a], expand[b]))
    }

    return expanded
  }
)

module.exports = {
  getActiveImageProps,
  getExpandedPhotos
}
