import { useEffect, useRef } from 'react'
import cx from 'classnames'
import { bool, func, number, shape, string } from 'prop-types'
import { useClickHandler } from '../../hooks/use-click-handler.js'
import { useEvent } from '../../hooks/use-event.js'

export const NoteListItem = ({
  note,
  isSelected,
  onContextMenu,
  onOpen,
  onSelect
}) => {

  let dom = useRef()

  useEffect(() => {
    if (isSelected)
      dom.current.scrollIntoViewIfNeeded(false)
  }, [isSelected])

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
    onClick() {
      onSelect(note)
    },
    onDoubleClick() {
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

NoteListItem.propTypes = {
  isSelected: bool,
  note: shape({
    id: number.isRequired,
    text: string.isRequired
  }).isRequired,
  onContextMenu: func.isRequired,
  onOpen: func.isRequired,
  onSelect: func.isRequired
}
