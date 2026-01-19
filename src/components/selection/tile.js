import { memo, useEffect, useRef } from 'react'
import cx from 'classnames'
import { Thumbnail } from '../photo/thumbnail.js'
import { useClickHandler } from '../../hooks/use-click-handler.js'
import { useDragDropSelection } from '../../hooks/use-drag-drop-selection.js'
import { useEvent } from '../../hooks/use-event.js'
import { pick } from '../../common/util.js'


export const SelectionTile = memo(({
  getAdjacent,
  isActive,
  isDisabled,
  isLast,
  isSortable,
  photo,
  selection,
  size = 48,
  onContextMenu,
  onDropSelection,
  onItemOpen,
  onSelect
}) => {
  let container = useRef()

  let { isDragging, isOver, offset, drag, drop } = useDragDropSelection({
    container,
    photo,
    selection,
    isVertical: false,
    canDrag: !isDisabled,
    getAdjacent,
    onDropSelection
  })

  useEffect(() => {
    if (isActive) {
      container.current?.scrollIntoViewIfNeeded()
    }
  }, [isActive])

  let select = useEvent(() => {
    onSelect(selection)
  })

  let open = useEvent(() => {
    onItemOpen(selection)
  })

  let handleClick = useClickHandler({
    onClick: select,
    onDoubleClick: open
  })

  let handleContextMenu = useEvent((event) => {
    select()
    onContextMenu(
      event,
      isDisabled ? 'selection-read-only' : 'selection',
      pick(photo, ['id', 'item', 'path', 'protocol'], {
        selection: selection.id
      }))
  })

  let direction = offset ? 'after' : 'before'

  return (
    <li
      ref={drag(drop(container))}
      className={cx({
        'active': isActive,
        'dragging': isDragging,
        'drop-target': isSortable,
        'last': isLast,
        'over': isOver,
        'selection': true,
        'tile': true,
        [direction]: isOver && offset != null
      })}
      onContextMenu={handleContextMenu}
      onClick={handleClick}>
      <div className="tile-state">
        <Thumbnail
          {...pick(selection, Thumbnail.keys)}
          consolidated={photo.consolidated}
          color={photo.color}
          mimetype={photo.mimetype}
          orientation={photo.orientation}
          size={size}/>
      </div>
    </li>
  )
})
