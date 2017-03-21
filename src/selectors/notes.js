'use strict'

const { seq, compose, cat, map, keep } = require('transducers.js')
const { createSelector: memo } = require('reselect')
const { getVisiblePhotos } = require('./photos')

const getNotes = ({ notes }) => notes

const getSelectedNote = memo(
  getNotes, ({ nav }) => nav.note, (notes, id) => notes[id]
)

const getVisibleNotes = memo(
  getNotes,
  getVisiblePhotos,

  (notes, ...parents) =>
    seq(parents, compose(
      cat,
      map(parent => parent.notes),
      cat,
      map(id => notes[id]),
      keep()
    ))
)


module.exports = {
  getSelectedNote,
  getVisibleNotes
}
