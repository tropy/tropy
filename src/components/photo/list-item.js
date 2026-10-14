import { memo, useRef } from 'react'
import { useSelector } from 'react-redux'
import cx from 'classnames'
import { Editable } from '../editable.js'
import { Thumbnail } from './thumbnail.js'
import { SelectionList } from '../selection/list.js'
import { Icon } from '../icons.js'
import { Button } from '../button.js'
import { TranscriptionIcon } from '../transcription/icon.js'
import { useDragDropPhoto } from '../../hooks/use-drag-drop-photo.js'
import { useSequenceClicks } from '../../hooks/use-sequence-clicks.js'
import { useEvent } from '../../hooks/use-event.js'
import { pick } from '../../common/util.js'
import { TYPE } from '../../constants/index.js'

export const PhotoListItem = memo(({
  getAdjacent,
  isActive,
  isDisabled,
  isEditing,
  isExpandable,
  isExpanded,
  isItemOpen,
  isSelected,
  isVertical,
  onChange,
  onConsolidate,
  onContextMenu,
  onDropPhoto,
  onEdit,
  onEditCancel,
  onItemOpen,
  onSelect,
  onSelectionSort,
  onToggle,
  photo,
  size = 48,
  title
}) => {
  let container = useRef()

  let titleText = useSelector(state =>
    state.metadata[photo.id]?.[title]?.text)

  let [{ canDrop, direction, isDragging, isOver }, dnd] =
    useDragDropPhoto(container, {
      photo,
      getAdjacent,
      isDisabled: isDisabled || isEditing,
      isVertical,
      onDrop: onDropPhoto
    })

  // Read-only (isDisabled here) blocks editing, not selection.
  let sequenceClicks = useSequenceClicks({
    isSelected: isActive,
    onDoubleClick: isItemOpen ? (!isDisabled && onEdit) : onItemOpen,
    onSelect,
    onSelectedClick: !isDisabled && onEdit,
    value: photo
  })

  let handleChange = useEvent((text) => {
    onChange({
      id: photo.id,
      data: {
        [title]: { text, type: TYPE.TEXT }
      }
    })

    onEditCancel()
  })

  // TODO: buttons must stop the mouse-down, too, or the
  // item selects on press (see chaining in ITERATOR-PLAN.md).
  let stopPropagation = (event) => {
    event.stopPropagation()
  }

  let handleConsolidate = (event) => {
    event.stopPropagation()
    onConsolidate(photo)
  }

  let handleToggle = (event) => {
    event.stopPropagation()
    onToggle(photo)
  }

  return (
    <li
      ref={dnd}
      className={cx('photo', {
        active: isActive,
        dragging: isDragging,
        expandable: isExpandable,
        expanded: isExpanded,
        over: isOver && canDrop,
        [direction]: direction
      })}>
      <div
        className="photo-container"
        onContextMenu={(event) => onContextMenu(event, photo)}
        {...sequenceClicks}>
        {isExpandable && (
          <Button
            noFocus
            icon={<Icon name="Chevron9"/>}
            className="disclosure"
            onClick={handleToggle}
            onMouseDown={stopPropagation}/>
        )}
        <div className="thumbnail-container">
          <Thumbnail
            {...pick(photo, Thumbnail.keys)}
            size={size}/>
        </div>
        <div className="title">
          <Editable
            value={titleText}
            resize
            isActive={isEditing}
            isDisabled={isDisabled}
            onCancel={onEditCancel}
            onChange={handleChange}/>
        </div>
        <div className="icon-container">
          {photo.broken && (
            <Button
              icon={<Icon name="Warning"/>}
              title="photo.consolidate"
              onClick={handleConsolidate}
              onMouseDown={stopPropagation}/>
          )}
          {isExpandable && <Icon name="Selection"/>}
          <TranscriptionIcon id={photo.transcriptions?.at(-1)}/>
        </div>
      </div>
      {isExpanded && (
        <SelectionList
          isDisabled={isDisabled}
          isItemOpen={isItemOpen}
          onChange={onChange}
          onContextMenu={onContextMenu}
          onEdit={onEdit}
          onEditCancel={onEditCancel}
          onItemOpen={onItemOpen}
          onSelect={onSelect}
          onSort={onSelectionSort}
          photo={photo}/>
      )}
    </li>
  )
})
