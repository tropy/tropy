import { memo, useRef } from 'react'
import { useSelector } from 'react-redux'
import { useIntl } from 'react-intl'
import { DND } from '../dnd.js'
import { useDragDropSelection } from '../../hooks/use-drag-drop-selection.js'
import { useElementClicks } from '../../hooks/use-element-clicks.js'
import { useEvent } from '../../hooks/use-event.js'
import { Editable } from '../editable.js'
import { Thumbnail } from '../photo/thumbnail.js'
import { TranscriptionIcon } from '../transcription/icon.js'
import { pick } from '../../common/util.js'
import cx from 'classnames'

export const SelectionListItem = memo(({
  getAdjacent,
  isActive,
  isDisabled,
  isEditing,
  isItemOpen,
  isLast,
  isSortable,
  onChange,
  onContextMenu,
  onDrop,
  onEdit,
  onEditCancel,
  onItemOpen,
  onSelect,
  photo,
  selection,
  size = 48,
  title
}) => {
  let container = useRef()
  let intl = useIntl()

  let [{ canDrop, direction, dragType, isDragging, isOver }, dnd] =
    useDragDropSelection(container, {
      selection,
      photo,
      getAdjacent,
      isDisabled,
      isEditing,
      isSortable,
      onDrop
    })

  // Read-only (isDisabled here) blocks editing, not selection.
  let elementClicks = useElementClicks({
    isSelected: isActive,
    onDoubleClick: isItemOpen ? (!isDisabled && onEdit) : onItemOpen,
    onSelect,
    onSelectedClick: !isDisabled && onEdit,
    value: selection
  })

  let handleChange = useEvent((text) => {
    onChange({
      id: selection.id,
      data: {
        [title]: { text, type: 'text' }
      }
    })
    onEditCancel()
  })

  let titleText = useSelector(state =>
    state.metadata?.[selection.id]?.[title]?.text)
  let placeholder = intl.formatMessage({
    id: 'panel.photo.selection'
  })

  let noDropTarget = dragType === DND.PHOTO ||
    (dragType === DND.SELECTION && !canDrop)

  return (
    <li
      ref={dnd}
      className={cx('selection', {
        active: isActive,
        'no-drop-target': noDropTarget,
        dragging: isDragging,
        last: isLast,
        over: isOver && canDrop,
        [direction]: direction
      })}
      onContextMenu={(event) => onContextMenu(event, selection)}
      {...elementClicks}>
      <div className="thumbnail-container">
        <Thumbnail
          {...pick(selection, Thumbnail.keys)}
          consolidated={photo.consolidated}
          color={photo.color}
          mimetype={photo.mimetype}
          size={size}/>
      </div>
      <div className="title">
        <Editable
          display={titleText || placeholder}
          value={titleText}
          resize
          isActive={isEditing}
          isDisabled={isDisabled}
          onCancel={onEditCancel}
          onChange={handleChange}/>
      </div>
      <div className="icon-container">
        <TranscriptionIcon id={selection.transcriptions?.at(-1)}/>
      </div>
    </li>
  )
})
