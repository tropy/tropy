import { useRef } from 'react'
import cx from 'classnames'
import { useClickHandler } from '../../hooks/use-click-handler.js'
import { useEvent } from '../../hooks/use-event.js'
import { useScrollIntoView } from '../../hooks/use-scroll-into-view.js'

export const NoteListItem = ({
  note,
  isSelected,
  onContextMenu,
  onOpen,
  onSelect
}) => {

  let dom = useRef()

  useScrollIntoView(dom, { when: isSelected })

  let handleContextMenu = useEvent((event) => {
    if (!isSelected) onSelect(note)

    onContextMenu?.(event, 'note', {
      notes: [note.id],
      item: note.item,
      photo: note.photo,
      selection: note.selection
    })
  })

  let handleMouseDown = useClickHandler({
    onClick () {
      onSelect(note)
    },
    onDoubleClick () {
      onOpen(note)
    }
  })

  return (
    <li
      ref={dom}
      className={cx('note', { active: isSelected })}
      onMouseDown={handleMouseDown}
      onContextMenu={handleContextMenu}>
      <div className="css-multiline-truncate">
        {note.text.slice(0, 280)}
      </div>
    </li>
  )
}
