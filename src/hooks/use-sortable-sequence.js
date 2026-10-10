import { useEvent } from './use-event.js'
import { useDropOutside } from './use-drop-outside.js'
import { adjacent } from '../common/sequence.js'
import { move } from '../common/util.js'

// Sorts a sequence by drag and drop:
// the counterpart to useSortableElement on its elements.
// The items are the element ids in their current order;
// onSort receives the new order.
// Dropping outside the elements moves the dragged one to the end.

export function useSortableSequence ({
  type,
  canDrop,
  isDisabled,
  items,
  onSort
}) {
  let isSortable = !isDisabled && items.length > 1

  let getAdjacent = useEvent((value) => adjacent(items, value.id))

  let onDrop = useEvent(({ id, to, offset }) => {
    onSort(move(items, id, to, offset))
  })

  let canDropOutside = useEvent((item) =>
    isSortable &&
    item.id !== items.at(-1) &&
    (canDrop == null || canDrop(item)))

  let [outside, drop] = useDropOutside({
    type,
    canDrop: canDropOutside,
    items,
    onDrop
  })

  return {
    canDrop: outside.canDrop,
    drop,
    getAdjacent,
    isOver: outside.isOver,
    isSortable,
    onDrop
  }
}
