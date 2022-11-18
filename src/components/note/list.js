import { useRef } from 'react'
import { Scroll } from '../scroll/index.js'
import { NoteListItem } from './list-item.js'
import { TABS, SASS } from '../../constants/index.js'
import { match } from '../../keymap.js'
import { arrayOf, bool, func, number, object, shape } from 'prop-types'
import { useEvent } from '../../hooks/use-event.js'


export const NoteList = ({
  isReadOnly,
  keymap,
  notes,
  onBlur,
  onContextMenu,
  onRemove,
  onOpen,
  onSelect,
  onTabFocus,
  rowHeight,
  selection,
  tabIndex
}) => {

  let scroll = useRef()

  let handleSelect = useEvent((note, event) => {
    if (note == null || note.id === selection?.id)
      return

    onSelect({
      note: note.id,
      photo: note.photo,
      selection: note.selection
    }, { throttle: event?.repeat })
  })

  let handleRemove = useEvent((note) => {
    if (!isReadOnly) {
      onRemove({
        photo: note.photo,
        selection: note.selection,
        notes: [note.id]
      })
    }
  })

  let handleKeyDown = useEvent((event) => {
    switch (match(keymap, event)) {
      case 'open':
        onOpen(scroll.current.current)
        break
      case 'remove':
        handleRemove(scroll.current.current)
        break
      default:
        return
    }

    event.preventDefault()
    event.stopPropagation()
  })

  return (
    <div className="note-list">
      <Scroll
        ref={scroll}
        cursor={selection?.id}
        items={notes}
        itemHeight={rowHeight}
        tabIndex={tabIndex}
        onBlur={onBlur}
        onKeyDown={handleKeyDown}
        onSelect={handleSelect}
        onTabFocus={onTabFocus}>
        {(note) => (
          <NoteListItem
            key={note.id}
            isSelected={note.id === selection?.id}
            note={note.id === selection?.id ? selection : note}
            onContextMenu={onContextMenu}
            onOpen={onOpen}
            onSelect={handleSelect}/>
        )}
      </Scroll>
    </div>
  )
}

NoteList.propTypes = {
  isReadOnly: bool,
  keymap: object.isRequired,
  notes: arrayOf(shape({
    id: number.isRequired
  })).isRequired,
  onBlur: func,
  onContextMenu: func.isRequired,
  onRemove: func.isRequired,
  onOpen: func.isRequired,
  onSelect: func.isRequired,
  onTabFocus: func,
  rowHeight: number.isRequired,
  selection: shape({
    id: number
  }),
  tabIndex: number
}

NoteList.defaultProps = {
  rowHeight: SASS.NOTE.ROW_HEIGHT,
  tabIndex: TABS.NoteList
}
