'use strict'

const React = require('react')
const { Iterator } = require('../iterator')
const { NoteListItem } = require('./list-item')
const { TABS } = require('../../constants')
const { match } = require('../../keymap')
const { get } = require('../../common/util')
const { arrayOf, bool, func, number, object, shape } = require('prop-types')


class NoteList extends Iterator {
  get tabIndex() {
    return this.size === 0 ? null : TABS.NoteList
  }

  getIterables() {
    return this.props.notes
  }

  head() {
    return get(this.props.selection, ['id'])
  }

  isSelected({ id }) {
    return id === this.head()
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
        onSelect={this.select}/>
    )
  }

  render() {
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
