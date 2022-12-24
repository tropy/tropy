import { createSelector as memo } from 'reselect'
import { seq, compose, cat, map, keep } from 'transducers.js'
import { getVisiblePhotos } from './photos'
import { getVisibleSelections } from './selections'

const getNotes = ({ notes }) => notes
const getSelectedNoteId = ({ nav }) => nav.note

export const getSelectedNote = memo(
  getNotes, getSelectedNoteId, (notes, id) => notes[id]
)

export const getVisibleNotes = memo(
  getNotes,
  getVisiblePhotos,
  getVisibleSelections,

  (notes, ...parents) =>
    seq(parents, compose(
      cat,
      map(parent => parent.notes),
      keep(),
      cat,
      map(id => notes[id]),
      keep()
    ))
)

export const getNextNoteSelection = memo(
  getSelectedNoteId,
  getVisibleNotes,
  (id, notes) => {
    let idx = notes.findIndex(note => note.id === id)

    if (idx === -1 || notes.length <= 1)
      return null

    let prev = notes[idx - 1]
    let cursor = notes[idx]
    let next = notes[idx + 1]

    if (prev == null)
      return next
    if (next == null)
      return prev

    if (next.photo === cursor.photo && next.selection === cursor.selection)
      return next
    if (prev.photo === cursor.photo && prev.selection === prev.selection)
      return prev

    return next
  }
)


export const getNotesMap = (state, props) =>
  props.notes.reduce((map, noteId) => {
    let { photo, selection } = state.notes[noteId]

    let id = (selection != null) ? selection : photo
    let type = (selection != null) ? 'selection' : 'photo'

    if (map.has(id))
      map.get(id).notes.push(noteId)
    else
      map.set(id, {
        id,
        type,
        notes: [noteId]
      })

    return map

  }, new Map)
