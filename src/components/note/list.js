import { useState } from 'react'
import { Scroll } from '../scroll/index.js'
import { NoteListItem } from './list-item.js'
import { TABS, SASS } from '../../constants/index.js'
import { Cursor } from '../../common/sequence.js'
import { useCursorKeys } from '../../hooks/use-cursor-keys.js'
import { useEvent } from '../../hooks/use-event.js'
import { useKeyMap } from '../../hooks/use-keymap.js'


export const NoteList = ({
  isReadOnly,
  notes,
  onContextMenu,
  onRemove,
  onOpen,
  onSelect,
  rowHeight = SASS.NOTE.ROW_HEIGHT,
  selection,
  tabIndex = TABS.NoteList
}) => {
  let [layout, setLayout] = useState()
  let cursor = new Cursor(notes, selection?.id, layout)

  let handleSelect = useEvent((note, { repeat } = {}) => {
    if (!(note == null || note.id === selection?.id))
      onSelect({
        note: note.id,
        photo: note.photo,
        selection: note.selection
      }, { throttle: repeat })
  })

  let handleContextMenu = (event, note) => {
    onContextMenu?.(event, 'note', {
      notes: [note.id],
      item: note.item,
      photo: note.photo,
      selection: note.selection
    })
  }

  let handleKeyDown = useCursorKeys(cursor, {
    scrollKeys: 'select',
    onMove: handleSelect,
    onKeyDown: useKeyMap('NoteList', {
      open () {
        onOpen(cursor.current())
      },
      remove: !isReadOnly && (() => {
        let note = cursor.current()

        if (note == null)
          return false

        onRemove([note.id])
      })
    })
  })

  return (
    <div className="note-list">
      <Scroll
        cursor={selection?.id}
        items={notes}
        itemHeight={rowHeight}
        tabIndex={tabIndex}
        onLayoutChange={setLayout}
        onKeyDown={handleKeyDown}>
        {(note) => (
          <NoteListItem
            key={note.id}
            isSelected={note.id === selection?.id}
            note={note.id === selection?.id ? selection : note}
            onContextMenu={handleContextMenu}
            onOpen={onOpen}
            onSelect={handleSelect}/>
        )}
      </Scroll>
    </div>
  )
}
