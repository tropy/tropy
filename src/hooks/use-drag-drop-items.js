import { useEffect } from 'react'
import { useEvent } from './use-event.js'
import { DND, getEmptyImage, useDrag, useDrop } from '../components/dnd.js'

export function useDragItems (item, { getSelection, isDisabled = false }) {
  let canDrag = useEvent(() => !(isDisabled || item.deleted))

  let createDragItem = useEvent(() => ({
    items: [
      { ...item },
      ...getSelection()
        .filter(id => id !== item.id)
        .map(id => ({ id }))
    ]
  }))

  let [props, drag, preview] = useDrag(() => ({
    type: DND.ITEMS,
    canDrag,
    item: createDragItem,
    collect: (monitor) => ({
      isDragging: monitor.isDragging()
    })
  }), [])

  useEffect(() => {
    preview(getEmptyImage())
  }, [preview])

  return [props, drag]
}

export function useDropItems ({ onDrop, canDrop, isDisabled = false }) {
  let handleDrop = useEvent((item) => {
    onDrop(item.items)
  })

  let handleCanDrop = useEvent((item, monitor) =>
    !isDisabled && (canDrop == null || canDrop(item, monitor)))

  return useDrop(() => ({
    accept: DND.ITEMS,
    drop: handleDrop,
    canDrop: handleCanDrop,
    collect: (monitor) => ({
      isOver: monitor.isOver(),
      canDrop: monitor.canDrop()
    })
  }), [])
}
