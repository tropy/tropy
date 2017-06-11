'use strict'

const { createSelector: memo } = require('reselect')

const getColumns = memo(
  ({ columns }) => columns,
  ({ ontology }) => ontology.props,

  (cols, props) =>
    cols.map(column => ({
      ...column,
      property: props[column.property] || {
        id: column.property
      }
    }))
)

module.exports = {
  getColumns
}
