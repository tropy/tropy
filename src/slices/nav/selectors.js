import { createSelector } from '@reduxjs/toolkit'
import { Selection } from '../../common/selection.js'
import { createSequence, resultEqualityCheck } from '../../common/sequence.js'
import { selectItemSequence } from '../qr.js'

// The itemSelection over itemSequence.
// This is the base selector for active items.
// Changes frequently!
export const selectItemSelection = createSelector(
  (state) => state.nav.select.item,
  selectItemSequence,
  (state, seq) => new Selection(state, seq)
)

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
  (items, ids) => {
    let activeItems = []

    for (let id of ids) {
      let item = items[id]
      if (item != null) activeItems.push(item)
    }

    return activeItems
  }, {
    memoizeOptions: { resultEqualityCheck }
  })

// The photos of the active items, in display order (indexed):
// the key sequence of the photo level.
export const selectActivePhotoIds = createSelector(
  selectActiveItems,
  (items) => {
    let [ids, push] = createSequence()

    for (let item of items)
      for (let id of item.photos) push(id)

    return ids
  }, {
    memoizeOptions: { resultEqualityCheck }
  })

// The active photos (indexed: the photo iterators look them up),
// for selectors reading fields of all of them.
export const selectActivePhotos = createSelector(
  (state) => state.photos,
  selectActivePhotoIds,
  (photos, ids) => {
    let [activePhotos, push] = createSequence()

    for (let id of ids) {
      let photo = photos[id]
      if (photo != null) push(photo)
    }

    return activePhotos
  }, {
    memoizeOptions: { resultEqualityCheck }
  })

// The photo level's navigation sequence (indexed), as displayed:
// the grid has the photos only (its expansion row navigates
// on its own), the list each photo with its expanded selections.
export const selectPhotoSequence = createSelector(
  (state) => state.ui.panel.zoom > 0,
  (state) => state.panel.expand,
  selectActivePhotoIds,
  selectActivePhotos,
  (isGrid, expand, ids, photos) => {
    if (isGrid)
      return ids

    let [seq, push] = createSequence()

    for (let photo of photos) {
      push(photo.id)

      if (expand[photo.id] > 0)
        for (let id of photo.selections) push(id)
    }

    return seq
  }, {
    memoizeOptions: { resultEqualityCheck }
  })

// The photo Selection over the photo sequence (photo and selection ids).
// The base of the photo level: changes with every selection change
// and every change of the sequence (e.g. expanding a photo).
export const selectPhotoSelection = createSelector(
  (state) => state.nav.select.photo,
  selectPhotoSequence,
  (state, seq) => new Selection(state, seq)
)

// The photo level's cursor: a photo or a photo selection id.
// The primary, as at the item level.
export const selectPhotoCursor = (state) =>
  selectPhotoSelection(state).primary()

// The photo selection at the cursor, if any.
export const selectCursorSelection = (state) =>
  state.selections[selectPhotoCursor(state)] ?? null

// The photo at the cursor: the photo selection's photo, or the photo.
export const selectCursorPhoto = (state) => {
  let id = selectPhotoCursor(state)
  return state.photos[state.selections[id]?.photo ?? id] ?? null
}

export const selectNoteCursor = (state) =>
  state.nav.select.note.cursor

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
  })
)

export const selectActiveNote = createSelector(
  ({ notes }) => notes,
  selectNoteCursor,
  (notes, id) => notes[id]
)
