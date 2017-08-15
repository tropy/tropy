'use strict'

const { createSelector: memo } = require('reselect')

const getActiveSelection = memo(
  ({ selections }) => selections,
  ({ nav }) => nav.selection,
  (selections, id) => (id != null) ? selections[id] : null
)

module.exports = {
  getActiveSelection
}
