'use strict'

const React = require('react')
const { PureComponent } = React
const { NoteListItem } = require('./list-item')
const { TABS } = require('../../constants')
const { match } = require('../../keymap')
const { has } = require('../../common/util')
const { arrayOf, bool, func, number, object, shape } = require('prop-types')


class NoteList extends PureComponent {

  get isEmpty() {
    return this.props.notes.length === 0
  }

  get hasSelection() {
    return has(this.props.selection, ['id'])
  }

  get tabIndex() {
    return this.isEmpty ? null : TABS.NoteList
  }

  isSelected(note) {
    return this.hasSelection && note.id === this.props.selection.id
  }

  next(offset = 1) {
    if (this.isEmpty) return null
    if (!this.hasSelection) return this.props.notes[0]
    return this.props.notes[this.idx[this.props.selection.id] + offset]
  }

  prev(offset = 1) {
    return this.next(-offset)
  }

  current() {
    return this.next(0)
  }

  select = (note) => {
    if (note && !this.isSelected(note)) {
      this.props.onSelect({
        note:
        note.id,
        photo: note.photo,
        selection: note.selection
      })
    }
  }

  handleKeyDown = (event) => {
    switch (match(this.props.keymap, event)) {
      case 'up':
        this.select(this.prev())
        break
      case 'down':
        this.select(this.next())
        break
      case 'open':
        this.props.onOpen(this.current())
        break
      default:
        return
    }

    event.preventDefault()
    event.stopPropagation()
  }

  renderNoteListItem = (note, index) => {
    const { selection, isDisabled, onContextMenu, onOpen } = this.props
    const isSelected = this.isSelected(note)

    this.idx[note.id] = index

    return (
      <NoteListItem
        key={note.id}
        note={isSelected ? selection : note}
        isDisabled={isDisabled}
        isSelected={isSelected}
        onContextMenu={onContextMenu}
        onOpen={onOpen}
        onSelect={this.select}/>
    )
  }
  render() {
    this.idx = {}

    return (
      <ul
        className="note list"
        tabIndex={this.tabIndex}
        onKeyDown={this.handleKeyDown}>
        {this.props.notes.map(this.renderNoteListItem)}
      </ul>
    )
  }

  static propTypes = {
    keymap: object.isRequired,
    notes: arrayOf(shape({
      id: number.isRequired
    })).isRequired,
    selection: shape({
      id: number
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
