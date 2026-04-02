import { memo, useEffect, useRef } from 'react'
import { useDragDropSelection } from '../../hooks/use-drag-drop-selection.js'
import { useClickHandler } from '../../hooks/use-click-handler.js'
import { useEvent } from '../../hooks/use-event.js'
import { Thumbnail } from '../photo/thumbnail.js'
import { pick } from '../../common/util.js'
import cx from 'classnames'

export const SelectionTile = memo(({
  getAdjacent,
  isActive,
  isDisabled,
  isLast,
  isSortable,
  isVertical,
  onContextMenu,
  onDrop,
  onItemOpen,
  onSelect,
  photo,
  selection,
  size = 512
}) => {
  let container = useRef()

  let [{ isDragging, isOver, direction }, dnd] =
    useDragDropSelection(container, {
      selection,
      photo,
      getAdjacent,
      isDisabled,
      isSortable,
      isVertical,
      onDrop
    })

  useEffect(() => {
    if (isActive)
      container.current?.scrollIntoViewIfNeeded()
  }, [isActive])

  let handleClick = useClickHandler({
    onClick: () => onSelect(selection),
    onDoubleClick: () => onItemOpen(selection)
  })

  let handleContextMenu = useEvent((event) => {
    onSelect(selection)
    onContextMenu(
      event,
      isDisabled ? 'selection-read-only' : 'selection',
      pick(photo, ['id', 'item', 'path', 'protocol'], {
        selection: selection.id
      }))
  })

  return (
    <li
      ref={dnd}
      className={cx({
        active: isActive,
        dragging: isDragging,
        'drop-target': isSortable,
        last: isLast,
        over: isOver,
        selection: true,
        tile: true,
        [direction]: direction
      })}
      onContextMenu={handleContextMenu}
      onClick={handleClick}>
      <div className="tile-state">
        <Thumbnail
          {...pick(selection, Thumbnail.keys)}
          consolidated={photo.consolidated}
          color={photo.color}
          mimetype={photo.mimetype}
          size={size}/>
      </div>
    </li>
  )
})
