import { memo, useRef } from 'react'
import cx from 'classnames'
import { Thumbnail } from './thumbnail.js'
import { Icon } from '../icons.js'
import { TranscriptionIcon } from '../transcription/icon.js'
import { Button } from '../button.js'
import { useDragDropPhoto } from '../../hooks/use-drag-drop-photo.js'
import { useScrollIntoView } from '../../hooks/use-scroll-into-view.js'
import { useSequenceClicks } from '../../hooks/use-sequence-clicks.js'
import { pick } from '../../common/util.js'

export const PhotoTile = memo(({
  getAdjacent,
  isDisabled,
  isExpandable,
  isExpanded,
  isLast,
  isSelected,
  isVertical,
  onConsolidate,
  onContextMenu,
  onDropPhoto,
  onItemOpen,
  onSelect,
  onToggle,
  photo,
  selection,
  size = 512
}) => {
  let container = useRef()

  let [{ canDrop, direction, isDragging, isOver }, dnd] =
    useDragDropPhoto(container, {
      photo,
      getAdjacent,
      isDisabled,
      isVertical,
      onDrop: onDropPhoto
    })

  useScrollIntoView(container, { when: isSelected })

  // Read-only (isDisabled here) does not block selection.
  let sequenceClicks = useSequenceClicks({
    isSelected: isSelected && selection == null,
    onDoubleClick: onItemOpen,
    onSelect,
    value: photo
  })

  return (
    <li
      ref={dnd}
      className={cx('photo', 'tile', {
        active: isSelected,
        dragging: isDragging,
        expandable: isExpandable,
        expanded: isExpanded,
        last: isLast,
        over: isOver && canDrop,
        [direction]: direction
      })}>
      <div className="tile-state">
        <Thumbnail
          {...pick(photo, Thumbnail.keys)}
          size={size}
          onContextMenu={(event) => onContextMenu(event, photo)}
          {...sequenceClicks}/>
        {photo.broken && (
          <Button
            icon={<Icon name="WarningOverlay"/>}
            className="warning"
            title="photo.consolidate"
            onClick={() => onConsolidate(photo)}/>
        )}
        <div className="icon-container">
          {isExpandable && (
            <Button
              icon={<Icon name="SelectionOverlay"/>}
              onClick={() => onToggle(photo)}/>
          )}
          <TranscriptionIcon
            id={photo.transcriptions?.at(-1)}
            overlay/>
        </div>
      </div>
      {isExpanded && <div className="pointer"/>}
    </li>
  )
})
