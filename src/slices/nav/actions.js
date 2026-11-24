import { createAction } from '@reduxjs/toolkit'
import { focus, primary, from as toSelection } from '../../common/selection.js'
import { selectViewOf } from '../qr.js'

export const restored = createAction('nav/restored')

export const viewShown = createAction('nav/viewShown', (payload, meta) => ({
  payload,
  meta: { log: 'trace', history: true, search: true, ...meta }
}))

const prepareAction = (payload, meta) => ({
  payload, meta: { log: 'trace', history: true, ...meta }
})

export const itemSelected =
  createAction('nav/select/itemSelected', prepareAction)

export const itemOpened =
  createAction('nav/itemOpened', prepareAction)

export const photoSelected =
  createAction('nav/select/photoSelected', prepareAction)

export const noteSelected =
  createAction('nav/select/noteSelected', prepareAction)


/*
 * Nav cursor and cursor paths:
 * item > photo (or photo selection) > note.
 *
 * The nav cursor is the current cursor path,
 * based on current nav.select's cursors.
 *
 * On select we check the given path params
 * and pass the item's paths, because the nav reducer
 * does not see the items, photos and notes.
 *
 * The reducer completes the path using the defaults:
 * the current photo and note where they fit,
 * else the first photo and its first note.
 */

// Checks a (partial) cursor path top-down.
function checkCursorPath (state, {
  item,
  photo,
  selection,
  note
}) {
  if (photo != null && !state.items[item]?.photos.includes(photo))
    throw new Error(`photo ${photo} is not in item ${item}`)

  if (selection != null &&
    (photo == null || state.selections[selection]?.photo !== photo))
    throw new Error(`selection ${selection} is not in photo ${photo}`)

  if (note != null && !selectNoteIds(state, selection ?? photo)?.includes(note))
    throw new Error(`note ${note} is not in ${selection ?? photo}`)
}

const selectNoteIds = (state, id) =>
  (state.selections[id] ?? state.photos[id])?.notes

// Returns an item's photos/selections and their notes.
function selectCursorPaths (state, id) {
  let photos = state.items[id]?.photos ?? []
  let notes = {}

  // NB: we create a notes entry for each photo/selection,
  // so the reducer can use this to see all ids there!
  for (let photo of photos) {
    notes[photo] = state.photos[photo]?.notes ?? []

    for (let selection of state.photos[photo]?.selections ?? [])
      notes[selection] = state.selections[selection]?.notes ?? []
  }

  return { photos, notes }
}

function buildCursorPath (state, { item, photo, selection, note }) {
  item = toSelection(item)
  let id = primary(item)

  checkCursorPath(state, { item: id, photo, selection, note })

  return {
    item,
    photo,
    selection,
    note,
    ...(id != null && selectCursorPaths(state, id))
  }
}

export const select = {
  // These thunks handle item selection,
  // as well as selecting photos and notes within an item.
  // They add the necessary facts (photo, notes ids) to the payload,
  // for the reducers to set valid cursor paths.
  item (payload, meta) {
    return (dispatch, getState) =>
      dispatch(itemSelected(buildCursorPath(getState(), payload), meta))
  },

  photo (payload, meta) {
    return (dispatch, getState) => {
      let state = getState()
      let { item, photo, selection, note } = payload ?? {}
      let notes

      if (photo != null) {
        item ??= state.photos[photo]?.item
        checkCursorPath(state, { item, photo, selection, note })
        notes = selectNoteIds(state, selection ?? photo) ?? []
      }

      return dispatch(photoSelected({
        item,
        photo,
        selection,
        note,
        notes
      }, meta))
    }
  },

  note (payload, meta) {
    if (payload == null)
      return { type: noteSelected.type, payload, meta }

    return (dispatch, getState) => {
      let state = getState()
      let { note, photo, item, selection } = payload

      photo ??= state.selections[selection]?.photo
      item ??= state.photos[photo]?.item

      checkCursorPath(state, { item, photo, selection, note })

      return dispatch(noteSelected({ note, photo, item, selection }, meta))
    }
  }
}

export const open = {
  // Opens an item by selecting it in item mode.
  // Also switches to another view if the item is not visible,
  // as open.item can get called from the API.
  item ({ id, photo, selection, note } = {}, meta) {
    return (dispatch, getState) => {
      let state = getState()

      if (state.items[id] == null)
        throw new Error(`unknown item ${id}`)

      checkCursorPath(state, { item: id, photo, selection, note })

      let view = selectViewOf(state, id)
      if (view != null) dispatch(viewShown(view))

      state = getState()

      return dispatch(itemOpened(buildCursorPath(state, {
        item: focus(state.nav.select.item, id),
        photo,
        selection,
        note
      }), meta))
    }
  }
}
