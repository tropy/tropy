'use strict'

const React = require('react')
const { PureComponent, PropTypes } = React
const { NoteListItem } = require('./list-item')
const { arrayOf, bool, func, number, shape } = PropTypes

class NoteList extends PureComponent {

  isSelected(note) {
    return this.props.selection && note.id === this.props.selection.id
  }

  handleSelect = (note) => {
    if (note && !this.isSelected(note)) {
      this.props.onSelect({
        note: note.id, photo: note.photo
      })
    }
  }

  renderNoteListItem = (note) => {
    const { selection, isDisabled, onContextMenu, onOpen } = this.props
    const isSelected = this.isSelected(note)

    return (
      <NoteListItem
        key={note.id}
        note={isSelected ? selection : note}
        isDisabled={isDisabled}
        isSelected={isSelected}
        onContextMenu={onContextMenu}
        onOpen={onOpen}
        onSelect={this.handleSelect}/>
    )
  }
  render() {
    return (
      <ul className="note list">
        {this.props.notes.map(this.renderNoteListItem)}
      </ul>
    )
  }

  static propTypes = {
    notes: arrayOf(shape({
      id: number.isRequired
    })).isRequired,

    selection: shape({
      id: number.isRequired
    }),

    isDisabled: bool,

    onSelect: func.isRequired,
    onContextMenu: func.isRequired,
    onOpen: func.isRequired
  }
}

module.exports = {
  NoteList
}
