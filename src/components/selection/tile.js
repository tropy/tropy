import { memo, useRef } from 'react'
import { useDragDropSelection } from '../../hooks/use-drag-drop-selection.js'
import { useScrollIntoView } from '../../hooks/use-scroll-into-view.js'
import { useSequenceClicks } from '../../hooks/use-sequence-clicks.js'
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

  let [{ canDrop, isDragging, isOver, direction }, dnd] =
    useDragDropSelection(container, {
      selection,
      photo,
      getAdjacent,
      isDisabled,
      isSortable,
      isVertical,
      onDrop
    })

  useScrollIntoView(container, { when: isActive })

  // Read-only (isDisabled here) does not block selection.
  let sequenceClicks = useSequenceClicks({
    isSelected: isActive,
    onDoubleClick: onItemOpen,
    onSelect,
    value: selection
  })

  return (
    <li
      ref={dnd}
      className={cx({
        active: isActive,
        dragging: isDragging,
        last: isLast,
        over: isOver && canDrop,
        selection: true,
        tile: true,
        [direction]: direction
      })}
      onContextMenu={(event) => onContextMenu(event, selection)}
      {...sequenceClicks}>
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
