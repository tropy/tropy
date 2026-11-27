import { useEvent } from './use-event.js'
import { useSortableElement } from './use-sortable-element.js'
import { DND } from '../components/dnd.js'
import { pick } from '../common/util.js'
import { Thumbnail } from '../components/photo/thumbnail.js'

export function useDragDropPhoto (dom, {
  photo,
  getAdjacent,
  isDisabled = false,
  isSortable = true,
  isVertical = true,
  onDrop
}) {
  let createDragItem = useEvent(() => ({
    ...pick(photo, Thumbnail.keys),
    id: photo.id,
    item: photo.item
  }))

  return useSortableElement(dom, {
    id: photo.id,
    type: DND.PHOTO,
    createDragItem,
    getAdjacent: () => getAdjacent(photo),
    canDrop: () => isSortable,
    isDisabled,
    isVertical,
    onDrop
  })
}
