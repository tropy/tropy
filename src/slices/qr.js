import { createSlice } from '@reduxjs/toolkit'
import { createSelector as memo } from 'reselect'
import { parse } from '../common/search.js'
import { createMatcher } from '../common/matcher.js'
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

// The matcher of the search query, for highlighting (see
// common/matcher.js); null without terms or for an invalid query,
// which does not search either.
// Also null when highlights are switched off, and in item mode,
// where the query is not visible.
export const selectMatcher = memo(
  selectQuery,
  (state) =>
    state.settings.search.highlight && state.nav.mode !== NAV.MODE.ITEM,
  ({ terms, errors }, isEnabled) =>
    (!isEnabled || terms.length === 0 || errors.length > 0) ?
      null :
      createMatcher(terms))

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
