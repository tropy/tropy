'use strict'

const { createSelector: memo } = require('reselect')

const getColumns = memo(
  ({ columns }) => columns,
  ({ properties }) => properties,

  (columns, properties) =>
    columns.map(column => ({
      ...column,
      property: properties[column.property]
    }))
)


module.exports = {
  getColumns
}
