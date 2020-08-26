import { createSelector as memo } from 'reselect'
import { NAV, TYPE } from '../constants'
import { dc, expand } from '../ontology'

import {
  getItemTemplateProperties,
  getPropertyList
} from './ontology'

const DEFAULT_SORT = { column: dc.title, asc: true }
const DEFAULT_LIST_SORT =  { column: 'added', asc: true }

const SPECIAL_COLUMNS = [
  NAV.COLUMN.CREATED,
  NAV.COLUMN.MODIFIED,
  NAV.COLUMN.TEMPLATE
]

const merge = (col, { label, name, prefix }) => ({
  type: TYPE.TEXT, ...col, label, name, prefix
})

const getSpecialColumns = memo(
  ({ intl }) => intl.messages, (msg) =>
    SPECIAL_COLUMNS.reduce((spc, col) => (
      (spc[col.id] = { ...col, label: msg[col.id] || col.id }), spc
    ), {})
)


export const getColumns = memo(
  ({ nav }) => nav.columns,
  ({ ontology }) => ontology.props,
  ({ ontology }) => ontology.vocab,
  getSpecialColumns,
  (cols, props, vocab, spc) =>
    cols.map(col => col.id in spc ?
      ({ ...spc[col.id], ...col }) :
      merge(col, expand(props[col.id] || { id: col.id }, vocab)))
)

const getAllFreeColumns = memo(
  ({ nav }) => nav.columns,
  getPropertyList,
  getSpecialColumns,
  (cols, props, spc) => [
    ...Object.values(spc).filter(({ id }) => !cols.find(col => col.id === id)),
    ...props.filter(prop => !cols.find(col => col.id === prop.id))
  ]
)

const getCommonFreeColumns = memo(
  ({ nav }) => nav.columns,
  getItemTemplateProperties,
  getSpecialColumns,
  (cols, props, spc) => [
    ...Object.values(spc).filter(({ id }) => !cols.find(col => col.id === id)),
    ...props.filter(prop => !cols.find(col => col.id === prop.id))
  ]
)

export const getAllColumns = memo(
  getColumns,
  getAllFreeColumns,
  getCommonFreeColumns,
  (active, all, common) => ({
    active,
    all: [...active, ...all],
    common: [...active, ...common]
  })
)

export const getSortColumn = memo(
  ({ nav }) => nav.sort,
  ({ nav }) => nav.list || 0,
  (sort, list) => ((list in sort) ?
    sort[list] :
    (list > 0) ? DEFAULT_LIST_SORT : DEFAULT_SORT)
)
