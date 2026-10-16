import { memo, useRef } from 'react'
import cx from 'classnames'
import { CoverImage } from './cover-image.js'
import { useDragDropItem } from '../../hooks/use-drag-drop-items.js'
import { useElementClicks } from '../../hooks/use-element-clicks.js'
import { getSelectionMode } from '../../keymap.js'

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

  let elementClicks = useElementClicks({
    isSelected,
    onDoubleClick: onItemOpen,
    onSelect: (value, keyState) =>
      onSelect(value, { mode: getSelectionMode(keyState) }),
    value: item
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
          {...elementClicks}
          cover={item.cover}
          onContextMenu={(event) => onContextMenu(event, item)}
          photos={item.photos}
          tags={item.tags}
          size={size}/>
      </div>
    </li>
  )
})
