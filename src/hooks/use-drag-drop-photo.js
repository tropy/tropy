import { useEvent } from './use-event.js'
import { useDragDropSortable } from './use-drag-drop-sortable.js'
import { DND, useDrop } from '../components/dnd.js'
import { pick } from '../common/util.js'
import { Thumbnail } from '../components/photo/thumbnail.js'

export function useDragDropPhoto (dom, {
  photo,
  getAdjacent,
  isDisabled = false,
  isVertical = true,
  onDrop
}) {
  let createDragItem = useEvent(() => ({
    ...pick(photo, Thumbnail.keys),
    id: photo.id,
    item: photo.item
  }))

  return useDragDropSortable(dom, {
    id: photo.id,
    type: DND.PHOTO,
    createDragItem,
    getAdjacent: () => getAdjacent(photo),
    isDisabled,
    isVertical,
    onDrop
  })
}

export function useDropPhoto ({ onDrop, canDrop, isDisabled = false }) {
  let handleDrop = useEvent((item) => {
    onDrop(item)
  })

  let handleCanDrop = useEvent((item, monitor) =>
    !isDisabled && (canDrop == null || canDrop(item, monitor)))

  return useDrop(() => ({
    accept: DND.PHOTO,
    drop: handleDrop,
    canDrop: handleCanDrop,
    collect: (monitor) => ({
      isOver: monitor.isOver(),
      canDrop: monitor.canDrop()
    })
  }), [])
}
