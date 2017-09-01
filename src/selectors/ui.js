'use strict'

const { createSelector: memo } = require('reselect')
const BLANK = {}

const getActiveImageProps = memo(
  ({ ui }) => ui.image,
  ({ nav }) => nav.photo,
  ({ nav }) => nav.selection,
  (image, photo, selection) => image[selection || photo] || BLANK
)

module.exports = {
  getActiveImageProps
}
