import { Scroll } from '../scroll/index.js'
import { TABS, SASS } from '../../constants/index.js'
import { useCursorKeys } from '../../hooks/use-cursor-keys.js'
import { useKeyMap } from '../../hooks/use-keymap.js'
import { useSequence } from '../../hooks/use-sequence.js'
import { useSequenceClicks } from '../../hooks/use-sequence-clicks.js'
import cx from 'classnames'


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
  let { cursor, onLayoutChange } = useSequence(notes, selection)

  let handleSelect = (note, { repeat } = {}) => {
    if (!(note == null || note.id === selection?.id))
      onSelect({
        note: note.id,
        photo: note.photo,
        selection: note.selection
      }, { throttle: repeat })
  }

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

  let clicks = useSequenceClicks(cursor, {
    onContextMenu: handleContextMenu,
    onDoubleClick: onOpen,
    onSelect: handleSelect
  })

  return (
    <div className="note-list" {...clicks}>
      <Scroll
        cursor={cursor}
        itemHeight={rowHeight}
        tabIndex={tabIndex}
        onLayoutChange={onLayoutChange}
        onKeyDown={handleKeyDown}>
        {(note, index) => {
          let isSelected = note.id === selection?.id

          return (
            <li
              key={note.id}
              className={cx('note', { active: isSelected })}
              data-index={index}>
              <div className="css-multiline-truncate">
                {(isSelected ? selection : note).text.slice(0, 280)}
              </div>
            </li>
          )
        }}
      </Scroll>
    </div>
  )
}
