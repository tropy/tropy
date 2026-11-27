import { useEffect, useRef, useState } from 'react'
import { useEvent } from '../../hooks/use-event.js'
import {
  DND, getEmptyImage, useDrag, useDragDropManager, useDrop
} from '../dnd.js'

// Drag and drop of items by delegation: one drag source and
// one drop target on the container, instead of one each per leaf
// (tile or row), so leaves mount and unmount cheaply while scrolling.
// Leaves are found by their data-index; they are draggable themselves,
// so a drag starts only on a leaf.
//
// Drag: the items (the pressed item first, then the selection).
// Drop: items onto an item (merge), a photo onto an item (move).
export function useItemDragDrop ({
  items,
  data,
  selection,
  isReadOnly,
  onDragStart,
  onDropItems,
  onDropPhotos
}) {
  let monitor = useDragDropManager().getMonitor()

  // The leaves pressed and hovered, set by the container's
  // native drag events: React's root listener runs before
  // react-dnd's window listener, so they are current when
  // react-dnd begins the drag, checks a drop or drops.
  let pressed = useRef(null)
  let hovered = useRef(null)

  // The hovered leaf, if it accepts the drop.
  let [over, setOver] = useState(null)

  let idOf = (node) => {
    let index = node?.closest?.('[data-index]')?.dataset.index
    return (index == null) ? null : (items[Number(index)] ?? null)
  }

  let canDropOn = (id, type, item) => {
    let target = data[id]

    if (isReadOnly || target == null || target.deleted)
      return false

    switch (type) {
      case DND.ITEMS:
        return !item.items.some(it => it.id === id)
      case DND.PHOTO:
        return item.item !== id
      default:
        return false
    }
  }

  let handleDragStart = (event) => {
    pressed.current = idOf(event.target)
  }

  // Not from react-dnd: it collects only when the container
  // is entered or left, and calls hover before it stores
  // the new pointer offset.
  let handleDragOver = (event) => {
    let id = idOf(event.target)
    hovered.current = id

    setOver(canDropOn(id, monitor.getItemType(), monitor.getItem())
      ? id
      : null)
  }

  let canDrag = useEvent(() => {
    let item = data[pressed.current]
    return !isReadOnly && item != null && !item.deleted
  })

  let createDragItem = useEvent(() => {
    let item = data[pressed.current]

    onDragStart(item.id)

    return {
      items: [
        { ...item },
        ...selection.ids()
          .filter(id => id !== item.id)
          .map(id => ({ id }))
      ]
    }
  })

  let [{ dragging }, drag, preview] = useDrag(() => ({
    type: DND.ITEMS,
    canDrag,
    item: createDragItem,
    collect: (m) => ({
      dragging: m.isDragging() ? m.getItem().items[0].id : null
    })
  }), [])

  useEffect(() => {
    preview(getEmptyImage())
  }, [preview])

  let handleCanDrop = useEvent((item, m) =>
    canDropOn(hovered.current, m.getItemType(), item))

  let handleDrop = useEvent((item, m) => {
    let id = hovered.current

    if (m.getItemType() === DND.ITEMS)
      onDropItems([id, ...item.items.map(it => it.id)])
    else
      onDropPhotos({ item: id, photos: [item] })
  })

  let [isOver, drop] = useDrop(() => ({
    accept: [DND.ITEMS, DND.PHOTO],
    canDrop: handleCanDrop,
    drop: handleDrop,
    collect: (m) => m.isOver()
  }), [])

  let connect = (element) =>
    drag(drop(element))

  let getLeafProps = (id) => ({
    isDragging: id === dragging,
    isOver: isOver && id === over
  })

  return { connect, getLeafProps, handleDragOver, handleDragStart }
}
