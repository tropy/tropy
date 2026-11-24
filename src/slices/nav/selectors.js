import { createSelector } from '@reduxjs/toolkit'
import { Selection, primary } from '../../common/selection.js'
import { resultEqualityCheck } from '../../common/sequence.js'
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

// The photo level's cursor: a photo or a photo selection id.
// The primary, as at the item level (to build on a photo Selection).
export const selectPhotoCursor = (state) =>
  primary(state.nav.select.photo)

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
