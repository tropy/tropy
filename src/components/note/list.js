import { useRef } from 'react'
import { arrayOf, bool, func, number, shape } from 'prop-types'
import { Scroll } from '../scroll/index.js'
import { NoteListItem } from './list-item.js'
import { TABS, SASS } from '../../constants/index.js'
import { useEvent } from '../../hooks/use-event.js'
import { useKeyMap } from '../../hooks/use-keymap.js'

export const NoteList = ({
  isReadOnly,
  notes,
  onContextMenu,
  onRemove,
  onOpen,
  onSelect,
  rowHeight,
  selection,
  tabIndex
}) => {
  let scroll = useRef()

  let handleSelect = useEvent((note, event) => {
    if (!(note == null || note.id === selection?.id))
      onSelect({
        note: note.id,
        photo: note.photo,
        selection: note.selection
      }, { throttle: event?.repeat })
  })

  let handleRemove = useEvent((note) => {
    if (!(isReadOnly || note == null))
      onRemove([note.id])
  })

  let handleKeyDown = useKeyMap('NoteList', {
    open() {
      onOpen(scroll.current.current)
    },
    remove() {
      handleRemove(scroll.current.current)
    }
  })

  return (
    <div className="note-list">
      <Scroll
        ref={scroll}
        cursor={selection?.id}
        items={notes}
        itemHeight={rowHeight}
        tabIndex={tabIndex}
        onKeyDown={handleKeyDown}
        onSelect={handleSelect}>
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
  notes: arrayOf(shape({
    id: number.isRequired
  })).isRequired,
  onContextMenu: func.isRequired,
  onRemove: func.isRequired,
  onOpen: func.isRequired,
  onSelect: func.isRequired,
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
