import { createSelector as memo } from 'reselect'
import { seq, compose, cat, map, keep } from 'transducers.js'
import { getVisiblePhotos, getSelectedPhoto } from './photos'
import { getVisibleSelections } from './selections'

const getNotes = ({ notes }) => notes
const getSelectedNoteId = ({ nav }) => nav.note

export const getSelectedNote = memo(
  getNotes, getSelectedNoteId, (notes, id) => notes[id]
)

export const getSelectableNoteId = memo(
  getSelectedPhoto, getSelectedNoteId, (photo, id) => {
    if (!photo) return null
    if (!photo.notes.length) return null
    if (!id) return photo.notes[0]

    const idx = photo.notes.indexOf(id)

    if (idx < 0) return photo.notes[0]
    if (idx > 0) return photo.notes[idx - 1]

    return photo.notes[idx + 1]
  }
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
