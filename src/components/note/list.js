'use strict'

const React = require('react')
const { PropTypes } = React
const { NoteListItem } = require('./list-item')
const { shape, arrayOf, number, bool, func } = PropTypes

const NoteList = ({ notes, selection }) => (
  <ul className="note-list">
    {notes.map(note =>
      <NoteListItem
        key={note.id}
        note={note}
        isSelected={note.id === selection}/>
    )}
  </ul>
)

NoteList.propTypes = {
  notes: arrayOf(shape({
    id: number.isRequired
  })).isRequired,

  selection: number,

  isDisabled: bool,

  onSelect: func.isRequired,
  onContextMenu: func.isRequired
}

module.exports = {
  NoteList
}
