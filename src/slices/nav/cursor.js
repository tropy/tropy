import { createSelector } from '@reduxjs/toolkit'
import { selectItemCursor } from '../../selectors/items.js'
import { selectMatchFilter } from '../qr.js'

// Root-level selectors for the cursors of nav's levels,
// with the fallbacks on read:
// a cursor that is hidden or not below its parent
// falls back to the parent's first visible photo or note;
// none (null) stays none, unless the parent fell back.
// Each is keyed by just what it depends on.

export { selectItemCursor }

// The stored cursors. The photo level's is a photo
// or a photo selection (its photo is the parent).
const getStoredPhoto = (state) =>
  state.nav.selection.photo.cursor

const getStoredParent = (state) =>
  state.selections[getStoredPhoto(state)]?.photo ?? null

const getStoredNote = (state) =>
  state.nav.selection.note.cursor

// The photo at the stored cursor, if selected since the snapshot
// of the contributors: what is selected stays visible.
// The cursor as of the snapshot is hidden unless it contributes
// (see contribute in sagas/search.js).
export const selectKeptPhoto = (state) => {
  let filter = selectMatchFilter(state)
  if (filter == null) return null

  let cursor = getStoredPhoto(state)
  if (cursor === filter.cursor?.photo) return null

  return getStoredParent(state) ?? cursor
}

// The note at the stored cursor, if selected since the snapshot.
export const selectKeptNote = (state) => {
  let filter = selectMatchFilter(state)
  if (filter == null) return null

  let note = getStoredNote(state)
  return (note === filter.cursor?.note) ? null : note
}

const getItemPhotos = (state) =>
  state.items[selectItemCursor(state)]?.photos

export const selectPhotoCursor = createSelector(
  getStoredPhoto,
  getStoredParent,
  getItemPhotos,
  selectMatchFilter,
  selectKeptPhoto,

  (cursor, parent, photos = [], filter, kept) => {
    if (cursor == null)
      return null

    let isVisible = (id) =>
      filter == null || !!filter.photos[id] || id === kept

    let id = parent ?? cursor

    return (photos.includes(id) && isVisible(id))
      ? id
      : photos.find(isVisible) ?? null
  }
)

// The stored photo selection, if its photo is at the cursor.
export const selectSelectionCursor = createSelector(
  selectPhotoCursor,
  getStoredPhoto,
  getStoredParent,
  (photo, cursor, parent) =>
    (parent != null && parent === photo) ? cursor : null
)

const getParentNotes = (state) => {
  let selection = selectSelectionCursor(state)

  return (selection != null)
    ? state.selections[selection]?.notes
    : state.photos[selectPhotoCursor(state)]?.notes
}

export const selectNoteCursor = createSelector(
  selectPhotoCursor,
  selectSelectionCursor,
  getStoredPhoto,
  getStoredNote,
  getParentNotes,
  selectMatchFilter,
  selectKeptNote,

  (photo, selection, cursor, note, notes = [], filter, kept) => {
    if (photo == null)
      return null

    let isVisible = (id) =>
      filter == null || !!filter.notes[id] || id === kept

    if (note != null && notes.includes(note) && isVisible(note))
      return note

    // The photo level fell back: its note follows.
    let isFallback = (selection ?? photo) !== cursor

    return (note != null || isFallback)
      ? notes.find(isVisible) ?? null
      : null
  }
)

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
