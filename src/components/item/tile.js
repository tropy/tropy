import { memo } from 'react'
import cx from 'classnames'
import { CoverImage } from './cover-image.js'

export const ItemTile = memo(({
  index,
  isDragging,
  isLast,
  isOver,
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
