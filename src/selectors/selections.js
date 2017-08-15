'use strict'

const { createSelector: memo } = require('reselect')

const getActiveSelection = memo(
  ({ selections }) => selections,
  ({ nav }) => nav.selection,
  (selections, id) => (id != null) ? selections[id] : null
)

const getActiveSelectionData = memo(
  ({ metadata }) => metadata,
  ({ nav }) => nav.selection,
  (metadata, id) => (id != null) ? metadata[id] : null
)

module.exports = {
  getActiveSelection,
  getActiveSelectionData
}
