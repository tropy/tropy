import { createSelector as memo } from 'reselect'
import { seq, compose, cat, map, keep } from 'transducers.js'
import { getVisiblePhotos } from './photos.js'
import { getVisibleSelections } from './selections.js'
import { Cursor } from '../common/sequence.js'

const getNotes = ({ notes }) => notes
const getSelectedNoteId = ({ nav }) => nav.note

export const getSelectedNote = memo(
  getNotes, getSelectedNoteId, (notes, id) => notes[id]
)

export const getNoteParent = ({ notes, photos, selections }, { id }) => {
  let { photo, selection } = notes[id]

  if (photo == null) {
    photo = selections[selection].photo
  }

  let { item } = photos[photo]

  return { item, photo, selection }
}

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

const isSibling = (note, other) =>
  other != null &&
  other.photo === note.photo &&
  other.selection === note.selection

export const getNextNoteSelection = memo(
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
