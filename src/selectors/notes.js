'use strict'

const { seq, compose, cat, map, keep } = require('transducers.js')
const { createSelector: memo } = require('reselect')
const { getVisiblePhotos, getSelectedPhoto } = require('./photos')
const { getVisibleSelections } = require('./selections')

const getNotes = ({ notes }) => notes
const getSelectedNoteId = ({ nav }) => nav.note

const getSelectedNote = memo(
  getNotes, getSelectedNoteId, (notes, id) => notes[id]
)

const getSelectableNoteId = memo(
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

const getVisibleNotes = memo(
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


module.exports = {
  getSelectableNoteId,
  getSelectedNote,
  getVisibleNotes
}
