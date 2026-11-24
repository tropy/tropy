import { createSelector } from '@reduxjs/toolkit'
import { elements, ids, primary } from '../../common/selection.js'
import { stable } from '../../common/sequence.js'
import { pluck } from '../../selectors/util.js'
import { selectItemSequence } from '../qr.js'

// Root-level selectors for the cursors of nav's levels:
// plain reads of the stored cursors. The reducer and the
// commands keep the cursor path valid; stale state (e.g.
// restored after the project changed) is read as it is.

// The primary selected item represents the selection
// (merge target, bulk editor values and template).
export const selectItemCursor = (state) =>
  primary(state.nav.select.item)

// Scans the results: kept apart from the items, which change often.
const selectActiveItemIds = createSelector(
  (state) => state.nav.select.item,
  selectItemSequence,
  (selection, seq) => {
    let visible = elements(selection, seq)
    let inResults = new Set(visible)

    return [
      ...visible,
      ...ids(selection).filter(id => !inResults.has(id))
    ]
  }
)

// Keeps its identity while the selected items stay the same.
export const selectActiveItems = createSelector(
  (state) => state.items,
  selectActiveItemIds,
  pluck,
  {
    memoizeOptions: {
      resultEqualityCheck: (a, b) => stable(a, b) === b
    }
  }
)

// The photo level's cursor: a photo or a photo selection.
const getStoredPhoto = (state) =>
  state.nav.select.photo.cursor

const getStoredParent = (state) =>
  state.selections[getStoredPhoto(state)]?.photo

// The photo at the cursor: the photo selection's photo, or the photo.
export const selectPhotoCursor = (state) =>
  getStoredParent(state) ?? getStoredPhoto(state)

// The photo selection at the cursor, if any.
export const selectSelectionCursor = (state) =>
  (getStoredParent(state) != null) ? getStoredPhoto(state) : null

export const selectNoteCursor = (state) =>
  state.nav.select.note.cursor

export const selectNavCursor = createSelector(
  selectItemCursor,
  selectPhotoCursor,
  selectSelectionCursor,
  selectNoteCursor,
  (item, photo, selection, note) => ({
    item,
    photo,
    selection,
    note
  })
)

export const selectActivePhoto = createSelector(
  ({ photos }) => photos,
  selectPhotoCursor,
  (photos, id) => (id != null) ? photos[id] : null
)

export const selectActiveNote = createSelector(
  ({ notes }) => notes,
  selectNoteCursor,
  (notes, id) => notes[id]
)
