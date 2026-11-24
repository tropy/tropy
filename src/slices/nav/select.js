import { createSlice } from '@reduxjs/toolkit'
import { array } from '../../common/util.js'
import { isPending } from '../cmd.js'
import { ITEM } from '../../constants/index.js'

import {
  create as createSelection, focus, isBlank, remove
} from '../../common/selection.js'

import {
  itemOpened, itemSelected, noteSelected, photoSelected, restored
} from './actions.js'

const initialState = {
  item: createSelection(),
  photo: createSelection(),
  note: createSelection(),
  last: {} // Tracks last selected note for each photo.
}

// Sets item selection and updates photo/note selections.
const setItemSelection = (state, { payload }) => {
  state.item = payload.item

  let id = resolvePhoto(state, payload)
  setPhotoSelection(state, id, payload.note, payload.notes?.[id])
}

// Sets photo and note selection, resolving the default note if not given.
const setPhotoSelection = (state, id, note, notes) => {
  note = resolveNote(state, id, note, notes)
  state.photo = focus(state.photo, id)
  setNoteSelection(state, note)
}

// Sets the note selection and records cursor as last for current photo.
const setNoteSelection = (state, id) => {
  state.note = focus(state.note, id)

  if (id != null && state.photo.cursor != null)
    state.last[state.photo.cursor] = id
}

const resolveNote = (state, id, note, notes = []) => {
  if (id == null)
    return null
  if (note !== undefined)
    return note

  let { cursor } = state.note

  if (id === state.photo.cursor && (cursor == null || notes.includes(cursor)))
    return cursor

  let last = state.last[id]

  if (notes.includes(last))
    return last
  else
    return notes[0]
}

const resolvePhoto = (state, {
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


const selectSlice = createSlice({
  name: 'nav/select',
  initialState,

  reducers: {},

  extraReducers: (builder) => {
    builder
      .addCase(restored, (_, { payload }) => ({
        ...initialState,
        ...payload?.select
      }))

      .addCase(ITEM.REMOVE, (state, { payload }) =>
        pruneSelection(state, array(payload)))

      .addCase(itemSelected, setItemSelection)
      .addCase(itemOpened, setItemSelection)

      .addCase(photoSelected, (state, { payload }) => {
        if (payload?.photo != null)
          state.item = focus(state.item, payload.item)

        setPhotoSelection(state,
          payload?.selection ?? payload?.photo,
          payload?.note,
          payload?.notes)
      })

      .addCase(noteSelected, (state, { payload }) => {
        if (payload) {
          state.item = focus(state.item, payload.item)
          state.photo = focus(state.photo, payload.selection ?? payload.photo)
          setNoteSelection(state, payload.note)
        } else {
          setNoteSelection(state, null)
        }
      })

      .addMatcher(
        isPending(ITEM.DELETE, ITEM.RESTORE),
        (state, { payload }) => pruneSelection(state, array(payload))
      )
  }
})

export default selectSlice

export const clearSelection = (selection) =>
  isBlank(selection.item, selection.photo, selection.note)
    ? selection
    : { ...initialState, last: selection.last }

export const pruneSelection = (selection, ids) => {
  let item = remove(selection.item, ids)

  return (item === selection.item)
    ? selection
    : { ...clearSelection(selection), item }
}
