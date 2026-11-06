import { createSlice } from '@reduxjs/toolkit'
import { createSelector as memo } from 'reselect'
import { parse } from '../common/search.js'
import { NAV } from '../constants/index.js'
import { createMetaReducer } from './util.js'

const qr = createSlice({
  name: 'qr',
  initialState: {
    items: [],
    matches: null,
    // The subjects and notes matching the query, per matched item:
    // { subjects: { id: true }, notes: { id: true } }, null without terms.
    // Item level hits (metadata, tags) have the item as subject.
    hits: null,
    order: [],
    sort: null
  },

  reducers: {
    search: createMetaReducer({ cmd: 'project', hidden: true },
      (state) => state),

    update: {
      prepare: (payload = {}, meta) => ({
        payload,
        meta: { log: 'trace', ...meta }
      }),

      reducer: (state, { payload }) => ({
        ...state,
        ...payload
      })
    }
  }
})

export const {
  search,
  update
} = qr.actions

export const selectItemSequence = (state) =>
  state.qr.items

// The parsed search query: { terms, errors } (see common/search.js).
export const selectQuery = memo(
  (state) => state.nav.query,
  (query) => parse(query || ''))

export const selectSortKey = ({ items, metadata, ontology }, column) => {
  switch (column) {
    case NAV.COLUMN.CREATED.id:
      return (id) => items[id]?.created?.getTime()
    case NAV.COLUMN.MODIFIED.id:
      return (id) => items[id]?.modified?.getTime()
    case NAV.COLUMN.TEMPLATE.id:
      return (id) => ontology.template[items[id]?.template]?.name
    default:
      return (id) => metadata[id]?.[column]?.text
  }
}

export default qr.reducer
