import { memo, useRef } from 'react'
import cx from 'classnames'
import { CoverImage } from './cover-image.js'
import { useDragDropItem } from '../../hooks/use-drag-drop-items.js'

export const ItemTile = memo(({
  getSelection,
  index,
  isLast,
  isReadOnly,
  isSelected,
  item,
  onDropItems,
  onDropPhotos,
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

  return (
    <li
      ref={dnd}
      className={cx('item', 'tile', {
        active: isSelected,
        dragging: isDragging,
        last: isLast,
        over: isOver && canDrop
      })}>
      <div className="tile-state" data-index={index}>
        <CoverImage
          cover={item.cover}
          photos={item.photos}
          tags={item.tags}
          size={size}/>
      </div>
    </li>
  )
})
