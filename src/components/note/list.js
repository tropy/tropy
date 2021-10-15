import React from 'react'
import { Scroll } from '../scroll'
import { NoteListItem } from './list-item'
import { TABS, SASS } from '../../constants'
import { match } from '../../keymap'
import { arrayOf, bool, func, number, object, shape } from 'prop-types'


export class NoteList extends React.Component {
  scroll = React.createRef()

  get tabIndex() {
    return this.props.notes.length ? TABS.NoteList : null
  }

  isSelected({ id }) {
    return id === this.props.selection?.id
  }

  handleSelect = (note, event) => {
    if (note == null || this.isSelected(note))
      return

    this.props.onSelect({
      note: note.id,
      photo: note.photo,
      selection: note.selection
    }, { throttle: event?.repeat })
  }

  handleDelete(note) {
    this.props.onDelete({
      photo: note.photo,
      selection: note.selection,
      notes: [note.id]
    })
  }

  handleKeyDown = (event) => {
    switch (match(this.props.keymap, event)) {
      case 'open':
        this.props.onOpen(this.scroll.current.current)
        break
      case 'delete':
        this.handleDelete(this.scroll.current.current)
        break
      default:
        return
    }

    event.preventDefault()
    event.stopPropagation()
  }

  getIterableProps(note) {
    const isSelected = this.isSelected(note)

    return {
      note: isSelected ? this.props.selection : note,
      isDisabled: this.props.isDisabled,
      isSelected,
      onContextMenu: this.props.onContextMenu,
      onOpen: this.props.onOpen,
      onSelect: this.handleSelect
    }
  }

  render() {
    return (
      <div className="note-list">
        <Scroll
          ref={this.scroll}
          cursor={this.props.selection?.id}
          items={this.props.notes}
          itemHeight={SASS.NOTE.ROW_HEIGHT}
          tabIndex={this.tabIndex}
          onBlur={this.props.onBlur}
          onKeyDown={this.handleKeyDown}
          onSelect={this.handleSelect}
          onTabFocus={this.props.onTabFocus}>
          {(note) =>
            <NoteListItem
              {...this.getIterableProps(note)}
              key={note.id}/>
          }
        </Scroll>
      </div>
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
    onBlur: func,
    onTabFocus: func,
    onDelete: func.isRequired,
    onSelect: func.isRequired,
    onContextMenu: func.isRequired,
    onOpen: func.isRequired
  }
}
