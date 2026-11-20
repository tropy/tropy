import { createSelector, createSlice } from '@reduxjs/toolkit'
import * as datatype from '../../common/datatype.js'
import { dc } from '../../common/ns.js'
import { expand } from '../../ontology/index.js'
import {
  getItemTemplateProperties,
  getPropertyList
} from '../../selectors/ontology.js'
import { CREATED, MODIFIED, TEMPLATE } from './builtin.js'

/*
 * Columns are default fields used to display items,
 * most notably in the item table.
 */

const initialState = [
  { width: 250, id: dc.title },
  { width: 100, id: dc.creator },
  { width: 100, id: dc.date },
  { width: 100, id: dc.type },
  { width: 190, id: CREATED.id }
]

const isColumn = (col) =>
  typeof col?.id === 'string' && typeof col.width === 'number'

const isColumnArray = (cols) =>
  Array.isArray(cols) && cols.length > 0 && cols.every(isColumn)

const columns = createSlice({
  name: 'columns',
  initialState,

  reducers: {
    restore: (_, { payload }) =>
      isColumnArray(payload) ? payload : initialState,

    insert: {
      prepare: (payload, meta = {}) => ({ payload, meta }),
      reducer (state, { payload, meta }) {
        state.splice(meta.idx ?? state.length, 0, payload)
      }
    },

    remove: (state, { payload }) =>
      state.filter(col => col.id !== payload.id),

    order (state, { payload: { order } }) {
      state.sort((a, b) => order[a.id] - order[b.id])
    },

    resize (state, { payload: { column, width } }) {
      state[column].width = width
    }
  }
})

export const {
  insert,
  order,
  remove,
  resize,
  restore
} = columns.actions

export default columns.reducer

const toColumn = (col, { label, name, prefix }) => ({
  type: datatype.text, ...col, label, name, prefix
})

const selectBuiltinColumns = createSelector(
  ({ intl }) => intl.messages,
  (messages) => Object.fromEntries(
    [CREATED, MODIFIED, TEMPLATE].map(col =>
      [col.id, {
        ...col,
        label: messages[col.id] || col.id
      }]))
)

export const selectColumns = createSelector(
  ({ columns }) => columns,
  ({ ontology }) => ontology.props,
  ({ ontology }) => ontology.vocab,
  selectBuiltinColumns,
  (cols, props, vocab, builtins) =>
    cols.map(col => (col.id in builtins)
        ? ({ ...builtins[col.id], ...col })
        : toColumn(col, expand(props[col.id] || { id: col.id }, vocab))))

// Selects available columns for the column picker.
// Based on `opt` parameter either "all" known properties,
// or "common" ones, i.e. those in use by the project.
export const selectColumnOptions = createSelector(
  selectColumns,
  selectBuiltinColumns,
  (state, opt) => (opt === 'all')
    ? getPropertyList(state)
    : getItemTemplateProperties(state),
  (shown, builtins, props) => {
    let ids = new Set(shown.map(col => col.id))
    return [
      ...shown,
      ...Object.values(builtins).filter(col => !ids.has(col.id)),
      ...props.filter(prop => !ids.has(prop.id))
    ]
  }
)
