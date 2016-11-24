'use strict'

const {
  createSelector: memo
} = require('reselect')

const getColumns = memo(
  ({ ui }) => ui.columns,
  ({ properties }) => properties,

  (columns, properties) =>
    columns.map(col => ({
      ...col,
      property: properties[col.property]
    }))
)


module.exports = {
  getColumns
}
