'use strict'

const { createSelector: memo } = require('reselect')
const { DC, TYPE } = require('../constants')

const getColumns = memo(
  ({ columns }) => columns,
  ({ ontology }) => ontology.props,

  (cols, props) =>
    cols.map(column => ({
      type: TYPE.TEXT,
      ...column,
      property: props[column.property] || {
        id: column.property
      }
    }))
)

const DEFAULT_SORT = { context: 'metadata', column: DC.title, asc: true }
const DEFAULT_LIST_SORT =  { context: 'list', column: 'added', asc: true }

const getSortColumn = memo(
  ({ nav }) => nav.sort,
  ({ nav }) => nav.list || 0,

  (sort, list) => (
    (list in sort) ? sort[list] : (list > 0) ? DEFAULT_LIST_SORT : DEFAULT_SORT
  )
)

module.exports = {
  getColumns,
  getSortColumn
}
