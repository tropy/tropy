'use strict'

const React = require('react')
const { PureComponent, PropTypes } = React
const { NoteListItem } = require('./list-item')
const { shape, arrayOf, number, bool, func } = PropTypes

class NoteList extends PureComponent {

  isSelected(note) {
    return note.id === this.props.selection
  }

  handleSelect = (note) => {
    if (note && !this.isSelected(note)) {
      this.props.onSelect({
        note: note.id, photo: note.photo
      })
    }
  }

  render() {
    const { notes, isDisabled, onContextMenu, onOpen } = this.props

    return (
      <ul className="note list">
        {notes.map(note =>
          <NoteListItem
            key={note.id}
            note={note}
            isDisabled={isDisabled}
            isSelected={this.isSelected(note)}
            onContextMenu={onContextMenu}
            onOpen={onOpen}
            onSelect={this.handleSelect}/>
        )}
      </ul>
    )
  }

  static propTypes = {
    notes: arrayOf(shape({
      id: number.isRequired
    })).isRequired,

    selection: number,

    isDisabled: bool,

    onSelect: func.isRequired,
    onContextMenu: func.isRequired,
    onOpen: func.isRequired
  }
}

module.exports = {
  NoteList
}
