import { createSlice } from '@reduxjs/toolkit'
import { createSelector as memo } from 'reselect'
import { parse } from '../common/search.js'
import { createMatcher } from '../common/matcher.js'
import { NAV } from '../constants/index.js'
import { createMetaReducer } from './util.js'

const qr = createSlice({
  name: 'qr',
  initialState: {
    contributors: null,
    items: [],
    matches: null,
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

// A view that shows the item, when the current results do not:
// All Items, or the trash for a deleted item, without a query or
// tags (for nav.select). Null if the item is among the results.
// Opening an item from outside the view (links, API) switches to it.
export const selectViewOf = (state, id) =>
  (state.qr.matches == null || state.qr.matches[id]) ?
    null :
    { trash: state.items[id]?.deleted ? true : null, query: '' }

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

// The photos and notes of the selected items that contributed to
// the search match, as lookups ({ photos, notes }: id → true), or
// null without terms or selected items (see contributing in
// sagas/search.js). Null too when the match filter is off.
export const selectMatchFilter = (state) =>
  state.settings.search.filter ? state.qr.contributors : null

// Lookups for combining search terms (see common/matches.js):
// itemOf[subject] the item of an item, photo or selection id,
// photoOf[subject] the photo of a photo or selection id (0 otherwise),
// subjectOfNote(note) the photo or selection of a note.
// Trashed photos and selections (and those of trashed photos) map to
// nothing: only photos their item lists and selections their photo
// lists count, as in the item and photo lists. Trashed items count.
export const selectSubjects = memo(
  (state) => state.items,
  (state) => state.photos,
  (state) => state.notes,
  (items, photos, notes) => {
    // Live subjects only: items, the photos their item lists,
    // the selections their photo lists (one pass for the size).
    let max = 0

    for (let id in items) {
      let item = items[id]
      if (item.id > max) max = item.id

      for (let p of item.photos) {
        if (p > max) max = p
        for (let sel of photos[p]?.selections ?? [])
          if (sel > max) max = sel
      }
    }

    let itemOf = new Int32Array(max + 1)
    let photoOf = new Int32Array(max + 1)

    for (let id in items) {
      let item = items[id]
      itemOf[item.id] = item.id

      for (let p of item.photos) {
        let photo = photos[p]
        if (photo == null) continue

        itemOf[p] = item.id
        photoOf[p] = p

        for (let sel of photo.selections ?? []) {
          itemOf[sel] = item.id
          photoOf[sel] = p
        }
      }
    }

    let subjectOfNote = (id) => {
      let note = notes[id]
      return (note == null) ? 0 : (note.selection ?? note.photo ?? 0)
    }

    return { itemOf, photoOf, subjectOfNote }
  })

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
