import { createSelector } from '@reduxjs/toolkit'
import { selectItemCursor } from '../../selectors/items.js'

// Root-level selectors for the cursors of nav's levels:
// plain reads of the stored cursors. The reducer and the
// commands keep the cursor path valid; stale state (e.g.
// restored after the project changed) is read as it is.

export { selectItemCursor }

// The photo level's cursor: a photo or a photo selection.
const getStoredPhoto = (state) =>
  state.nav.selection.photo.cursor

const getStoredParent = (state) =>
  state.selections[getStoredPhoto(state)]?.photo

// The photo at the cursor: the photo selection's photo, or the photo.
export const selectPhotoCursor = (state) =>
  getStoredParent(state) ?? getStoredPhoto(state)

// The photo selection at the cursor, if any.
export const selectSelectionCursor = (state) =>
  (getStoredParent(state) != null) ? getStoredPhoto(state) : null

export const selectNoteCursor = (state) =>
  state.nav.selection.note.cursor

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
