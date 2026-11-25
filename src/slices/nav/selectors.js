import { createSelector } from '@reduxjs/toolkit'
import { selectItemSequence } from '../qr.js'
import { Selection } from '../../common/selection.js'
import {
  Cursor,
  createSequence,
  resultEqualityCheck
} from '../../common/sequence.js'

// The itemSelection over itemSequence.
// This is the base selector for active items.
// Changes frequently!
export const selectItemSelection = createSelector(
  (state) => state.nav.select.item,
  selectItemSequence,
  (state, seq) => new Selection(state, seq))

export const selectItemCursor = (state) =>
  selectItemSelection(state).primary()

export const selectCursorItem = (state) =>
  state.items[selectItemCursor(state)] ?? null

// The selected item ids in display order:
// Memoized to keep them slightly more stable.
export const selectActiveItemIds = createSelector(
  selectItemSelection,
  (itemSelection) => (
    itemSelection.elements()
  ), {
    memoizeOptions: { resultEqualityCheck }
  })

// The full selected items in display order.
// Visible photos (and notes) are derived from this.
export const selectActiveItems = createSelector(
  (state) => state.items,
  selectActiveItemIds,
  (items, activeItemIds) => {
    let activeItems = []

    for (let id of activeItemIds) {
      let item = items[id]
      if (item != null) activeItems.push(item)
    }

    return activeItems
  }, {
    memoizeOptions: { resultEqualityCheck }
  })

// The photos of the active items, in display order (indexed).
// Active photos, selections, notes all derive from this!
export const selectActivePhotoIds = createSelector(
  selectActiveItems,
  (activeItems) => {
    let activePhotoIds = createSequence()

    for (let item of activeItems)
      activePhotoIds.push(...item.photos)

    return activePhotoIds
  }, {
    memoizeOptions: { resultEqualityCheck }
  })

export const selectActivePhotos = createSelector(
  (state) => state.photos,
  selectActivePhotoIds,
  (photos, activePhotoIds) => {
    let activePhotos = []

    for (let id of activePhotoIds) {
      let photo = photos[id]
      if (photo != null) activePhotos.push(photo)
    }

    return activePhotos
  }, {
    memoizeOptions: { resultEqualityCheck }
  })

export const selectIsPhotoGrid = (state) =>
  state.ui.panel.zoom > 0

// The nav sequence at the photo level.
// Includes all active photos and their expanded selections.
// NB: photo grid still uses ONLY activePhotoIds sequence!
export const selectPhotoSequence = createSelector(
  selectIsPhotoGrid,
  (state) => state.panel.expand,
  selectActivePhotoIds,
  selectActivePhotos,
  (isPhotoGrid, isExpanded, activePhotoIds, photos) => {
    if (isPhotoGrid)
      return activePhotoIds

    let seq = createSequence()

    for (let photo of photos) {
      seq.push(photo.id)

      if (isExpanded[photo.id] > 0)
        seq.push(...photo.selections)
    }

    return seq
  }, {
    memoizeOptions: { resultEqualityCheck }
  })

// The photoSelection over the photoSequence.
export const selectPhotoSelection = createSelector(
  (state) => state.nav.select.photo,
  selectPhotoSequence,
  (state, seq) => new Selection(state, seq))

export const selectPhotoCursor = (state) =>
  selectPhotoSelection(state).primary()

export const selectCursorSelection = (state) =>
  state.selections[selectPhotoCursor(state)] ?? null

export const selectCursorPhoto = (state) => {
  let id = selectPhotoCursor(state)
  return state.photos[state.selections[id]?.photo ?? id] ?? null
}

// All notes underneath active items.
export const selectActiveNoteIds = createSelector(
  (state) => state.selections,
  selectActivePhotos,
  (selections, activePhotos) => {
    let activeNoteIds = createSequence()

    for (let photo of activePhotos) {
      activeNoteIds.push(...photo.notes)

      for (let id of photo.selections) {
        let selection = selections[id]
        if (selection != null)
          activeNoteIds.push(...selection.notes)
      }
    }

    return activeNoteIds
  }, {
    memoizeOptions: { resultEqualityCheck }
  })

export const selectActiveNotes = createSelector(
  (state) => state.notes,
  selectActiveNoteIds,
  (notes, activeNoteIds) => {
    let activeNotes = []

    for (let id of activeNoteIds) {
      let note = notes[id]
      if (note != null) activeNotes.push(note)
    }

    return activeNotes
  }, {
    memoizeOptions: { resultEqualityCheck }
  })

// The noteSelection over the activeNotes.
export const selectNoteSelection = createSelector(
  (state) => state.nav.select.note,
  selectActiveNoteIds,
  (state, seq) => new Selection(state, seq))

export const selectNoteCursor = (state) =>
  selectNoteSelection(state).primary()

export const selectCursorNote = (state) =>
  state.notes[selectNoteCursor(state)] ?? null

const isSibling = (note, other) =>
  other != null &&
  other.photo === note.photo &&
  other.selection === note.selection

// The note to select when the cursor note is removed:
// an adjacent note of the same parent, else an adjacent note.
export const selectNoteSuccessor = (state) => {
  let cursor = new Cursor(
    selectActiveNoteIds(state),
    selectNoteCursor(state))

  let note = state.notes[cursor.current()]

  let [prev, next] = cursor
    .adjacent()
    .map(id => state.notes[id] ?? null)

  if (note == null)
    return next ?? prev
  if (isSibling(note, next))
    return next
  if (isSibling(note, prev))
    return prev

  return next ?? prev
}

export const selectNavCursor = createSelector(
  selectItemCursor,
  (state) => selectCursorPhoto(state)?.id ?? null,
  (state) => selectCursorSelection(state)?.id ?? null,
  selectNoteCursor,
  (item, photo, selection, note) => ({
    item,
    photo,
    selection,
    note
  }))
