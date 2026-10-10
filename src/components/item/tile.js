import { memo, useRef } from 'react'
import cx from 'classnames'
import { CoverImage } from './cover-image.js'
import { useDragDropItem } from '../../hooks/use-drag-drop-items.js'
import { useItemClickHandler } from '../../hooks/use-item-click-handler.js'

export const ItemTile = memo(({
  getSelection,
  isLast,
  isReadOnly,
  isSelected,
  item,
  onContextMenu,
  onDropItems,
  onDropPhotos,
  onItemOpen,
  onSelect,
  size = 512
}) => {
  let container = useRef()

  let [{ canDrop, isDragging, isOver }, dnd] =
    useDragDropItem(container, {
      item,
      getSelection,
      isDisabled: isReadOnly,
      onDropItems,
      onDropPhotos
    })

  let handlers = useItemClickHandler(item, {
    isSelected,
    onContextMenu,
    onOpen: onItemOpen,
    onSelect
  })

  return (
    <li
      ref={dnd}
      className={cx('item', 'tile', {
        active: isSelected,
        dragging: isDragging,
        last: isLast,
        over: isOver && canDrop
      })}>
      <div className="tile-state">
        <CoverImage
          {...handlers}
          cover={item.cover}
          photos={item.photos}
          tags={item.tags}
          size={size}/>
      </div>
    </li>
  )
})
