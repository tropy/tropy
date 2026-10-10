import { memo, useRef } from 'react'
import cx from 'classnames'
import { Thumbnail } from './thumbnail.js'
import { Icon } from '../icons.js'
import { TranscriptionIcon } from '../transcription/icon.js'
import { Button } from '../button.js'
import { useDragDropPhoto } from '../../hooks/use-drag-drop-photo.js'
import { useClickHandler } from '../../hooks/use-click-handler.js'
import { useEvent } from '../../hooks/use-event.js'
import { useScrollIntoView } from '../../hooks/use-scroll-into-view.js'
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
  onContract,
  onDropPhoto,
  onExpand,
  onItemOpen,
  onSelect,
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

  let select = useEvent(() => {
    if (!(isSelected && selection == null))
      onSelect(photo)
  })

  let handleClick = useClickHandler({
    onClick: select,
    onDoubleClick: () => onItemOpen(photo)
  })

  let handleContextMenu = useEvent((event) => {
    select()
    onContextMenu(
      event,
      isDisabled ? 'photo-read-only' : 'photo',
      pick(photo, ['id', 'item', 'path', 'protocol']))
  })

  let handleConsolidate = useEvent((event) => {
    event?.stopPropagation()
    onConsolidate([photo.id], { force: true, prompt: true })
  })

  let handleExpansionToggle = useEvent((event) => {
    event?.stopPropagation()

    if (isExpanded)
      onContract(photo)
    else
      onExpand(photo)
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
          onClick={handleClick}
          onContextMenu={handleContextMenu}/>
        {photo.broken && (
          <Button
            icon={<Icon name="WarningOverlay"/>}
            className="warning"
            title="photo.consolidate"
            onClick={handleConsolidate}/>
        )}
        <div className="icon-container">
          {isExpandable && (
            <Button
              icon={<Icon name="SelectionOverlay"/>}
              onClick={handleExpansionToggle}/>
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
