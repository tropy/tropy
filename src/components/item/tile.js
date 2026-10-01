import { memo, useRef } from 'react'
import cx from 'classnames'
import { CoverImage } from './cover-image.js'
import { useDragItems, useDropItems } from '../../hooks/use-drag-drop-items.js'
import { useDropPhoto } from '../../hooks/use-drag-drop-photo.js'
import { useEvent } from '../../hooks/use-event.js'
import { isMeta } from '../../keymap.js'

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
  let wasSelected = useRef(false)

  let [{ isDragging }, drag] = useDragItems(item, {
    getSelection,
    isDisabled: isReadOnly
  })

  let [items, dropItems] = useDropItems({
    canDrop: ({ items }) =>
      !(item.deleted || items.find(({ id }) => id === item.id)),
    isDisabled: isReadOnly,
    onDrop: (items) => {
      onDropItems([item.id, ...items.map(({ id }) => id)])
    }
  })

  let [photo, dropPhoto] = useDropPhoto({
    canDrop: (photo) => !(item.deleted || photo.item === item.id),
    isDisabled: isReadOnly,
    onDrop: (photo) => {
      onDropPhotos({ item: item.id, photos: [photo] })
    }
  })

  let handleSelect = useEvent((event) => {
    if (!(event.button > 2)) {
      onSelect(item, {
        isMeta: isMeta(event),
        isRange: event.shiftKey
      })
    }
  })

  // Subtle: when an item is not selected, we need to select
  // on mouse down, because the mouse down may kick-off a
  // drag event. If the item is already selected, we handle
  // selection in the click event for the same reason!
  let handleMouseDown = useEvent((event) => {
    wasSelected.current = isSelected
    if (!isSelected) handleSelect(event)
  })

  let handleClick = useEvent((event) => {
    if (isSelected && wasSelected.current) handleSelect(event)
  })

  let handleOpen = useEvent(() => {
    onItemOpen({ id: item.id, photos: item.photos })
  })

  let handleContextMenu = useEvent((event) => {
    if (!isSelected) handleSelect(event)
    onContextMenu(event, item)
  })

  return (
    <li
      ref={isReadOnly ? container : drag(dropItems(dropPhoto(container)))}
      className={cx('item', 'tile', {
        active: isSelected,
        dragging: isDragging,
        last: isLast,
        over: (items.isOver && items.canDrop) ||
          (photo.isOver && photo.canDrop)
      })}>
      <div className="tile-state">
        <CoverImage
          cover={item.cover}
          photos={item.photos}
          tags={item.tags}
          size={size}
          onMouseDown={handleMouseDown}
          onClick={handleClick}
          onDoubleClick={handleOpen}
          onContextMenu={handleContextMenu}/>
      </div>
    </li>
  )
})
