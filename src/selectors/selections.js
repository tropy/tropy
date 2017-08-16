'use strict'

const { createSelector: memo } = require('reselect')
const { getSelectedPhoto } = require('./photo')
const { pluck } = require('../common/util')

const NOTHING = []
const getSelections = ({ selections }) => selections

const getActiveSelection = memo(
  getSelections,
  ({ nav }) => nav.selection,
  (selections, id) => (id != null) ? selections[id] : null
)

const getActiveSelectionData = memo(
  ({ metadata }) => metadata,
  ({ nav }) => nav.selection,
  (metadata, id) => (id != null) ? metadata[id] : null
)

const getPhotoSelections = memo(
  getSelectedPhoto,
  getSelections,
  (photo, selections) => (photo != null) ?
    pluck(selections, photo.selections) : NOTHING

)

module.exports = {
  getActiveSelection,
  getActiveSelectionData,
  getPhotoSelections
}
