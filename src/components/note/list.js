import React from 'react'
import { Iterator } from '../iterator'
import { NoteListItem } from './list-item'
import { TABS, SASS } from '../../constants'
import { match } from '../../keymap'
import { arrayOf, bool, func, number, object, shape } from 'prop-types'


export class NoteList extends Iterator {
  get tabIndex() {
    return this.size === 0 ? null : TABS.NoteList
  }

  getColumns() {
    return 1
  }

  getRowHeight() {
    return SASS.NOTE.ROW_HEIGHT
  }

  getIterables(props = this.props) {
    return props.notes
  }

  head() {
    return this.props.selection?.id
  }

  isSelected({ id }) {
    return id === this.head()
  }

  select = (note, { scrollIntoView, throttle } = {}) => {
    if (note == null || this.isSelected(note)) return

    if (scrollIntoView) {
      this.scrollIntoView(note, false)
    }

    this.props.onSelect({
      note: note.id,
      photo: note.photo,
      selection: note.selection
    }, { throttle })
  }

  handleFocus = () => {
    // No auto-select, because that could change the active photo!
    if (this.props.onTabFocus) {
      this.props.onTabFocus()
    }
  }

  handleKeyDown = (event) => {
    switch (match(this.props.keymap, event)) {
      case 'up':
        this.select(this.prev(), { scrollIntoView: true, throttle: true })
        break
      case 'down':
        this.select(this.next(), { scrollIntoView: true, throttle: true })
        break
      case 'home':
        this.handleHomeKey(event)
        break
      case 'end':
        this.handleEndKey(event)
        break
      case 'pageUp':
        this.handlePageUp(event)
        break
      case 'pageDown':
        this.handlePageDown(event)
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

  getIterableProps(note) {
    const isSelected = this.isSelected(note)

    return {
      note: isSelected ? this.props.selection : note,
      isDisabled: this.props.isDisabled,
      isSelected,
      onContextMenu: this.props.onContextMenu,
      onOpen: this.props.onOpen,
      onSelect: this.select
    }
  }

  render() {
    const { height } = this.state
    const { transform } = this

    return (
      <div className="note-list">
        <div
          className="scroll-container"
          ref={this.setContainer}
          tabIndex={this.tabIndex}
          onBlur={this.props.onBlur}
          onKeyDown={this.handleKeyDown}>
          <div className="runway" style={{ height }}>
            <ul className="viewport" style={{ transform }}>
              {this.mapIterableRange(props =>
                <NoteListItem {...props} key={props.note.id}/>)}
            </ul>
          </div>
        </div>
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
    onSelect: func.isRequired,
    onContextMenu: func.isRequired,
    onOpen: func.isRequired
  }
}
