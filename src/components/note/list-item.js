import cx from 'classnames'
import { useSequenceClicks } from '../../hooks/use-sequence-clicks.js'

export const NoteListItem = ({
  note,
  isSelected,
  onContextMenu,
  onOpen,
  onSelect
}) => {
  let sequenceClicks = useSequenceClicks({
    isSelected,
    onDoubleClick: onOpen,
    onSelect,
    value: note
  })

  return (
    <li
      className={cx('note', { active: isSelected })}
      onContextMenu={(event) => onContextMenu(event, note)}
      {...sequenceClicks}>
      <div className="css-multiline-truncate">
        {note.text.slice(0, 280)}
      </div>
    </li>
  )
}
