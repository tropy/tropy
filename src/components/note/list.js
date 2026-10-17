import { Scroll } from '../scroll/index.js'
import { TABS, SASS } from '../../constants/index.js'
import { useSequence } from '../../hooks/use-sequence.js'
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
  // Notes are not cleared or selected on tab focus.
  let handleSelect = (note, { cmd, throttle }) => {
    if (note == null || cmd === 'focus')
      return

    onSelect({
      note: note.id,
      photo: note.photo,
      selection: note.selection
    }, { throttle })
  }

  let handleContextMenu = (event, note) => {
    onContextMenu?.(event, 'note', {
      notes: [note.id],
      item: note.item,
      photo: note.photo,
      selection: note.selection
    })
  }

  let [scrollProps, handlers] = useSequence(notes, {
    selection,
    scrollKeys: 'select',
    keymap: 'NoteList',
    commands: {
      open ({ cursor }) {
        onOpen(cursor.current())
      },
      remove: !isReadOnly && (({ cursor }) => {
        let note = cursor.current()

        if (note == null)
          return false

        onRemove([note.id])
      })
    },
    onContextMenu: handleContextMenu,
    onOpen,
    onSelect: handleSelect
  })

  return (
    <div className="note-list" {...handlers}>
      <Scroll
        {...scrollProps}
        itemHeight={rowHeight}
        tabIndex={tabIndex}>
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
