import { createSlice } from '@reduxjs/toolkit'
import { array } from '../../common/util.js'
import { restore } from './actions.js'
import { isPending } from '../cmd.js'
import { ITEM, NOTE, PHOTO } from '../../constants/index.js'
import {
  create as createSelection,
  focus,
  isBlank,
  remove
} from '../../common/selection.js'

const initialState = {
  item: createSelection(),
  photo: createSelection(),
  note: createSelection(),
  last: {}
}

// Selects the note and records it as last for current photo.
const setNote = (state, id) => {
  state.note = focus(state.note, id)

  if (id != null && state.photo.cursor != null)
    state.last[state.photo.cursor] = id
}

// Selects the photo and note, resolving the default note if not given.
const setPhoto = (state, id, note, notes = []) => {
  let prev = state.photo.cursor
  let { cursor } = state.note
  let { last } = state

  state.photo = focus(state.photo, id)

  if (id == null)
    setNote(state, null)
  else if (note !== undefined)
    setNote(state, note)
  else if (id !== prev || !(cursor == null || notes.includes(cursor)))
    setNote(
      state,
      notes.includes(last[id]) ? last[id] : notes[0]
    )
}

// Resolves the default photo for the select params.
const defaultPhoto = (state, {
  photo,
  selection,
  photos = [],
  notes = {} // NB: carries all photo/selection ids of the item!
}) => {
  if (selection)
    return selection
  if (photo)
    return photo
  if (Object.hasOwn(notes, state.photo.cursor))
    return state.photo.cursor
  else
    return photos[0]
}

// Shared with nav's cross-slice reducer: pure, so they work on
// plain state there and as return values in the case reducers here.

// Clears the selection; the last notes stay.
export const clearSelection = (selection) =>
  isBlank(selection.item, selection.photo, selection.note)
    ? selection
    : { ...initialState, last: selection.last }

// Drops removed items from the selection.
// The photo level and note go too,
// as they may belong to a removed item.
export const pruneSelection = (selection, ids) => {
  let item = remove(selection.item, ids)

  return (item === selection.item)
    ? selection
    : { ...clearSelection(selection), item }
}

const selectionSlice = createSlice({
  name: 'nav/selection',
  initialState,

  reducers: {},

  extraReducers: (builder) => {
    builder
      .addCase(restore, (_, { payload }) => ({
        ...initialState,
        ...payload?.selection
      }))

      .addCase(ITEM.REMOVE, (state, { payload }) =>
        pruneSelection(state, array(payload)))

      .addCase(ITEM.SELECT, (state, { payload }) => {
        state.item = payload.item

        // Without a primary item, there are no paths: no photo.
        let id = defaultPhoto(state, payload)
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
          setNote(state, payload.note)
        } else {
          setNote(state, null)
        }
      })

      .addMatcher(
        isPending(ITEM.DELETE, ITEM.RESTORE),
        (state, { payload }) => pruneSelection(state, array(payload))
      )
  }
})

export default selectionSlice
