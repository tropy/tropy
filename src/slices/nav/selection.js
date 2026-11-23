import { createSlice } from '@reduxjs/toolkit'
import {
  create as createSelection,
  focus,
  ids,
  isSelection,
  remove
} from '../../common/selection.js'
import { array } from '../../common/util.js'
import { restore } from './actions.js'
import { isPending } from '../cmd.js'
import { ITEM, NOTE, PHOTO } from '../../constants/index.js'

const initialState = {
  item: createSelection(),
  photo: createSelection(),
  note: null
}

// The photo level holds photos and photo selections:
// the cursor is the photo selection shown, if any, or the photo.
// Without either, nothing is selected.
const focusPhoto = (state, id) =>
  (id == null) ? createSelection() : focus(state, id)

// Completes the cursor path below the item: sets the photo level
// and the note (see slices/nav/path.js). No photo, no note.
// A note given (null is none) is set; else the note stays while the
// photo level's cursor does, and is the first there when it moves.
const setPhoto = (state, id, note, notes = []) => {
  let prev = state.photo.cursor

  state.photo = focusPhoto(state.photo, id)

  if (id == null)
    state.note = null
  else if (note !== undefined)
    state.note = note
  else if (id !== prev || !(state.note == null || notes.includes(state.note)))
    state.note = notes[0] ?? null
}

// The photo level of the cursor path: the one given, else the
// cursor if it is on one of the item's paths, else the first photo.
const defaultPhoto = (state, { photo, selection, photos = [], notes = {} }) =>
  selection ?? photo ?? (
    Object.hasOwn(notes, state.photo.cursor) ? state.photo.cursor : photos[0])

// Drops removed photos or photo selections from the photo level.
// The note goes with the cursor.
const prunePhotos = (state, elements) => {
  let photo = remove(state.photo, elements)

  if (photo !== state.photo) {
    state.photo = photo
    if (photo.cursor == null) state.note = null
  }
}

// Shared with nav's cross-slice reducer: pure, so they work on
// plain state there and as return values in the case reducers here.

export const clearSelection = () => initialState

// Drops removed items from the selection.
// The photo level and note go too,
// as they may belong to a removed item.
export const pruneSelection = (selection, ids) => {
  let item = remove(selection.item, ids)

  return (item === selection.item)
    ? selection
    : { item, photo: createSelection(), note: null }
}

const prune = (state, { payload }) =>
  pruneSelection(state, array(payload))

const selectionSlice = createSlice({
  name: 'nav/selection',
  initialState,

  reducers: {},

  extraReducers: (builder) => {
    builder
      .addCase(restore, (_, { payload }) => {
        let { item, photo, note = null } = payload?.selection ?? {}

        if (!isSelection(item))
          return initialState

        return {
          item: createSelection(ids(item), item),
          photo: isSelection(photo)
            ? createSelection(ids(photo), photo)
            : createSelection(),
          note
        }
      })

      .addCase(ITEM.REMOVE, prune)

      .addCase(ITEM.SELECT, (state, { payload }) => {
        state.item = payload.item

        let id = (payload.item.cursor != null)
          ? defaultPhoto(state, payload)
          : null

        setPhoto(state, id, payload.note, payload.notes?.[id])
      })

      .addCase(PHOTO.SELECT, (state, { payload }) => {
        if (payload?.photo != null)
          state.item = focus(state.item, payload.item)

        setPhoto(state,
          payload?.selection ?? payload?.photo,
          payload?.note,
          payload?.notes)
      })

      .addCase(NOTE.SELECT, (state, { payload }) => {
        if (payload) {
          state.item = focus(state.item, payload.item)
          state.photo = focus(state.photo, payload.selection ?? payload.photo)
          state.note = payload.note
        } else {
          state.note = null
        }
      })

      // The photos' selections are in the payload: the reducer
      // cannot look them up.
      .addCase(ITEM.PHOTO.REMOVE, (state, { payload }) => {
        prunePhotos(state, [...payload.photos, ...(payload.selections ?? [])])
      })

      .addCase(PHOTO.SELECTION.REMOVE, (state, { payload }) => {
        prunePhotos(state, payload.selections)
      })

      // Requests: the items leave the selection before the view.
      .addMatcher(isPending(ITEM.DELETE, ITEM.RESTORE), prune)
  }
})

export default selectionSlice
