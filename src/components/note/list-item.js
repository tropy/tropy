import { useRef } from 'react'
import cx from 'classnames'
import { useScrollIntoView } from '../../hooks/use-scroll-into-view.js'
import { useSequenceClicks } from '../../hooks/use-sequence-clicks.js'

export const NoteListItem = ({
  note,
  isSelected,
  onContextMenu,
  onOpen,
  onSelect
}) => {

  let dom = useRef()

  useScrollIntoView(dom, { when: isSelected })

  let sequenceClicks = useSequenceClicks({
    isSelected,
    onDoubleClick: onOpen,
    onSelect,
    value: note
  })

  return (
    <li
      ref={dom}
      className={cx('note', { active: isSelected })}
      onContextMenu={(event) => onContextMenu(event, note)}
      {...sequenceClicks}>
      <div className="css-multiline-truncate">
        {note.text.slice(0, 280)}
      </div>
    </li>
  )
}
