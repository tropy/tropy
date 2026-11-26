import { createSlice } from '@reduxjs/toolkit'
import { array } from '../../common/util.js'
import { isPending } from '../cmd.js'
import { ITEM } from '../../constants/index.js'

import {
  create as createSelection, focus, head, isBlank, remove
} from '../../common/selection.js'

import {
  itemOpened, itemSelected, noteSelected, photoSelected, restored
} from './actions.js'

const initialState = {
  item: createSelection(),
  photo: createSelection(),
  note: createSelection(),
  last: {} // Tracks last note per photo, last photo per item.
}

// Sets item selection and updates photo/note selections.
const setItemSelection = (state, { payload }) => {
  state.item = payload.item

  let id = resolvePhoto(state, payload)
  setPhotoSelection(state, id, payload.note, payload.notes?.[id])
}

// Sets photo and note selection, resolving the default note if not given.
const setPhotoSelection = (state, id, note, notes) => {
  note = resolveNote(state, id, note, notes) // resolve first!

  focusPhotoSelection(state, id)
  focusNoteSelection(state, note)
}

// Sets the photo cursor and records it as last for the current item.
const focusPhotoSelection = (state, id) => {
  state.photo = focus(state.photo, id)
  remember(state, head(state.item), id)
}

// Sets the note selection and records cursor as last for current photo.
const focusNoteSelection = (state, id) => {
  state.note = focus(state.note, id)
  remember(state, head(state.photo), id)
}

const remember = ({ last }, parent, id) => {
  if (parent != null && id != null) last[parent] = id
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

  let last = state.last[head(state.item)]

  if (Object.hasOwn(notes, last))
    return last
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
          focusPhotoSelection(state, payload.selection ?? payload.photo)
          focusNoteSelection(state, payload.note)
        } else {
          focusNoteSelection(state, null)
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
