'use strict'

const React = require('react')
const { PropTypes } = React
const { NoteListItem } = require('./list-item')

const NoteList = ({ notes, selected }) => (
  <ul className="note-list">
    {notes.map(note =>
      <NoteListItem
        key={note}
        id={note}
        isSelected={note === selected}/>
    )}
  </ul>
)

NoteList.propTypes = {
  notes: PropTypes.arrayOf(PropTypes.number),
  selected: PropTypes.number,

  isDisabled: PropTypes.bool,

  onSelect: PropTypes.func,
  onContextMenu: PropTypes.func
}

module.exports = {
  NoteList
}
