'use strict'

const {
  createSelector: memo
} = require('reselect')

const getColumns = memo(
  ({ ui }) => ui.columns,
  ({ vocab }) => vocab,

  (columns, vocab) =>
    columns.map(col => ({
      ...col,
      property: vocab[col.property]
    }))
)


module.exports = {
  getColumns
}
