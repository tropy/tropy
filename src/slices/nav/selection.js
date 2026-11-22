import { createSlice } from '@reduxjs/toolkit'
import {
  create as createSelection,
  has,
  ids,
  remove
} from '../../common/selection.js'
import { array } from '../../common/util.js'
import { restore } from './actions.js'
import { isDone, isPending } from '../cmd.js'
import { ITEM, NOTE, PHOTO } from '../../constants/index.js'

const initialState = {
  item: createSelection(),
  photo: null,
  selection: null,
  note: null
}

const isSelection = (item) =>
  typeof item?.selected === 'object' && item.selected !== null

// Sets the item, photo, selection and note shown.
const setShown = (state, { item, photo, selection, note }) => {
  state.item = item
  state.photo = photo
  state.selection = selection
  state.note = note
}

// Shared with nav's cross-slice reducer: pure, so they work on
// plain state there and as return values in the case reducers here.

export const clearSelection = () => initialState

// Drops removed items from the selection. The photo, selection
// and note shown go too, as they may belong to a removed item.
export const pruneSelection = (selection, ids) => {
  let item = remove(selection.item, ids)

  return (item === selection.item)
    ? selection
    : { item, photo: null, selection: null, note: null }
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
      state.photo = photo
      state.selection = selection
      state.note = note
    }
  },

  extraReducers: (builder) => {
    builder
      .addCase(restore, (_, { payload }) => {
        let {
          item,
          photo = null,
          selection = null,
          note = null
        } = payload?.selection ?? {}

        if (!isSelection(item))
          return initialState

        return {
          item: createSelection(ids(item), item),
          photo,
          selection,
          note
        }
      })

      .addCase(ITEM.REMOVE, prune)

      .addCase(ITEM.SELECT, (state, { payload }) => {
        setShown(state, payload)
      })

      .addCase(PHOTO.SELECT, (state, { payload }) => {
        if (payload) {
          setShown(state, { ...payload, item: createSelection([payload.item]) })
        } else {
          state.photo = null
          state.selection = null
        }
      })

      .addCase(NOTE.SELECT, (state, { payload }) => {
        if (payload)
          setShown(state, { ...payload, item: createSelection([payload.item]) })
        else
          state.note = null
      })

      .addCase(ITEM.PHOTO.REMOVE, (state, { payload }) => {
        if (has(state.item, payload.id) &&
          payload.photos.includes(state.photo)) {
          state.photo = null
          state.selection = null
          state.note = null
        }
      })

      .addCase(PHOTO.SELECTION.REMOVE, (state, { payload }) => {
        if (payload.id === state.photo &&
          payload.selections.includes(state.selection)) {
          state.selection = null
          state.note = null
        }
      })

      // Requests: the items leave the selection before the view.
      .addMatcher(isPending(ITEM.DELETE, ITEM.RESTORE), prune)

      .addMatcher(isDone(ITEM.OPEN), (state, { payload }) => {
        if (payload != null)
          setShown(state, { ...payload, item: createSelection([payload.id]) })
      })

      .addMatcher(isDone(NOTE.OPEN), (state, { payload }) => {
        setShown(state, { ...payload, item: createSelection([payload.item]) })
      })
  }
})
