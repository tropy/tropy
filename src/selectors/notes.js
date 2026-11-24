import { createSelector as memo } from '@reduxjs/toolkit'
import { getVisibleSelections } from './photos.js'
import { selectActivePhotos } from '../slices/nav/selectors.js'
import { Cursor } from '../common/sequence.js'

const getNotes = ({ notes }) => notes
const getSelectedNoteId = ({ nav }) => nav.select.note.cursor

export const getNoteParent = ({ notes, photos, selections }, { id }) => {
  let { photo, selection } = notes[id]

  if (photo == null) {
    photo = selections[selection].photo
  }

  let { item } = photos[photo]

  return { item, photo, selection }
}

// The notes of the visible photos and selections.
export const getVisibleNotes = memo(
  getNotes,
  selectActivePhotos,
  getVisibleSelections,

  (notes, photos, selections) =>
    [...photos, ...selections]
      .flatMap(parent => parent.notes ?? [])
      .map(id => notes[id])
      .filter(note => note != null)
)

const isSibling = (note, other) =>
  other != null &&
  other.photo === note.photo &&
  other.selection === note.selection

export const getNoteSuccessor = memo(
  getSelectedNoteId,
  getVisibleNotes,
  (id, notes) => {
    let cursor = new Cursor(notes, id)
    let note = cursor.current()
    let [prev, next] = cursor.adjacent()

    if (isSibling(note, next)) return next
    if (isSibling(note, prev)) return prev

    return next ?? prev
  }
)


export const getNotesMap = (state, props) =>
  props.notes.reduce((nmap, noteId) => {
    let { photo, selection } = state.notes[noteId]

    let id = (selection != null) ? selection : photo
    let type = (selection != null) ? 'selection' : 'photo'

    if (nmap.has(id))
      nmap.get(id).notes.push(noteId)
    else
      nmap.set(id, {
        id,
        type,
        notes: [noteId]
      })

    return nmap

  }, new Map)
