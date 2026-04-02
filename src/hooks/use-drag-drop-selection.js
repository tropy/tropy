import { useEvent } from './use-event.js'
import { useDragDropSortable } from './use-drag-drop-sortable.js'
import { DND } from '../components/dnd.js'
import { pick } from '../common/util.js'
import { Thumbnail } from '../components/photo/thumbnail.js'

export function useDragDropSelection (dom, {
  selection,
  photo,
  getAdjacent,
  isDisabled = false,
  isEditing = false,
  isSortable = false,
  isVertical = true,
  onDrop
}) {
  let canDrop = useEvent((item) =>
    photo.id === item.photo)

  let createDragItem = useEvent(() => ({
    ...pick(selection, Thumbnail.keys),
    id: selection.id,
    photo: selection.photo,
    color: photo.color,
    mimetype: photo.mimetype,
    orientation: photo.orientation
  }))

  return useDragDropSortable(dom, {
    id: selection.id,
    type: DND.SELECTION,
    canDrop,
    createDragItem,
    getAdjacent: () => getAdjacent(selection),
    isDisabled: !isSortable || isDisabled || isEditing,
    isVertical,
    onDrop: onDrop
  })
}
