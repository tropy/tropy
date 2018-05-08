'use strict'

const { createSelector: memo } = require('reselect')
const { DC, TYPE } = require('../constants')
const ontology = require('./ontology')

const DEFAULT_SORT = { column: DC.title, asc: true }
const DEFAULT_LIST_SORT =  { column: 'added', asc: true }

const expand = (col, { label, name, prefix }) => ({
  type: TYPE.TEXT, ...col, label, name, prefix
})

const getColumns = memo(
  ({ nav }) => nav.columns,
  ({ ontology }) => ontology.props,
  ({ ontology }) => ontology.vocab,
  (cols, props, vocab) =>
    cols.map(col =>
      expand(col, ontology.expand(props[col.id] || { id: col.id }, vocab)))
)

const getFreeColumns = memo(
  ({ nav }) => nav.columns,
  ontology.getPropertyList,
  (cols, props) =>
    props.filter(prop => !cols.find(col => col.id === prop.id))
)

const getSortColumn = memo(
  ({ nav }) => nav.sort,
  ({ nav }) => nav.list || 0,
  (sort, list) => ((list in sort) ?
    sort[list] :
    (list > 0) ? DEFAULT_LIST_SORT : DEFAULT_SORT)
)

module.exports = {
  getFreeColumns,
  getColumns,
  getSortColumn
}
