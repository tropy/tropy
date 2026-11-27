import { memo } from 'react'
import cx from 'classnames'
import { CoverImage } from './cover-image.js'

// Drag and drop by delegation (useItemDragDrop).
export const ItemTile = memo(({
  index,
  isDragging,
  isLast,
  isOver,
  isReadOnly,
  isSelected,
  item,
  size = 512
}) => {
  return (
    <li
      className={cx('item', 'tile', {
        active: isSelected,
        dragging: isDragging,
        last: isLast,
        over: isOver
      })}>
      <div
        className="tile-state"
        data-index={index}
        draggable={!isReadOnly}>
        <CoverImage
          cover={item.cover}
          photos={item.photos}
          tags={item.tags}
          size={size}/>
      </div>
    </li>
  )
})
