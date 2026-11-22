import { createSlice } from '@reduxjs/toolkit'
import {
  create as createSelection,
  focus,
  ids,
  remove
} from '../../common/selection.js'
import { array } from '../../common/util.js'
import { restore } from './actions.js'
import { isDone, isPending } from '../cmd.js'
import { ITEM, NOTE, PHOTO } from '../../constants/index.js'

const initialState = {
  item: createSelection(),
  photo: createSelection(),
  note: null
}

const isSelection = (item) =>
  typeof item?.selected === 'object' && item.selected !== null

// The photo level holds photos and photo selections:
// the cursor is the photo selection shown, if any, or the photo.
// Without either, nothing is selected.
const focusPhoto = (state, id) =>
  (id == null) ? createSelection() : focus(state, id)

// Sets the item, photo, selection and note shown.
const setShown = (state, { item, photo, selection, note }) => {
  state.item = item
  state.photo = focusPhoto(state.photo, selection ?? photo)
  state.note = note ?? null
}

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

export const selectionSlice = createSlice({
  name: 'nav/selection',
  initialState,

  reducers: {
    // The search moved the photo and note cursors to matching ones
    // (see narrow in sagas/search.js): { photo, selection, note }.
    narrow (state, { payload: { photo, selection, note } }) {
      state.photo = focusPhoto(state.photo, selection ?? photo)
      state.note = note
    }
  },

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
        setShown(state, payload)
      })

      .addCase(PHOTO.SELECT, (state, { payload }) => {
        if (payload) {
          setShown(state, { ...payload, item: focus(state.item, payload.item) })
        } else {
          state.photo = createSelection()
        }
      })

      .addCase(NOTE.SELECT, (state, { payload }) => {
        if (payload)
          setShown(state, { ...payload, item: focus(state.item, payload.item) })
        else
          state.note = null
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

      .addMatcher(isDone(ITEM.OPEN), (state, { payload }) => {
        if (payload != null)
          setShown(state, { ...payload, item: focus(state.item, payload.id) })
      })

      .addMatcher(isDone(NOTE.OPEN), (state, { payload }) => {
        setShown(state, { ...payload, item: focus(state.item, payload.item) })
      })
  }
})
