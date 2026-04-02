import { useEffect, useState } from 'react'
import { useEvent } from './use-event.js'
import { getEmptyImage, useDrag, useDrop } from '../components/dnd.js'
import { bounds } from '../dom.js'

export function useDragDropSortable (element, {
  id,
  type,
  canDrop,
  createDragItem,
  getAdjacent,
  isDisabled = false,
  isVertical = true,
  onDrop
}) {
  let [offset, setOffset] = useState(null)
  let canDrag = useEvent(() => !isDisabled)

  let item = useEvent(() => ({
    ...createDragItem(),
    adj: getAdjacent()
  }))

  let handleHover = useEvent((item, monitor) => {
    let { top, left, width, height } = bounds(element.current)
    let { x, y } = monitor.getClientOffset()

    let o = null

    if (id !== item.id) {
      o = Math.round(
        isVertical ? ((y - top) / height) : ((x - left) / width)
      )

      if (item.adj[1 - o] === id) {
        o = null
      }
    }

    setOffset(o)
  })

  let handleDrop = useEvent((item) => {
    try {
      let result = { id: item.id, to: id, offset }

      if (result.id !== result.to && result.offset != null) {
        onDrop(result)
      }
    } finally {
      setOffset(null)
    }
  })

  let [{ isDragging }, drag, preview] = useDrag({
    type,
    canDrag,
    item,
    collect: (monitor) => ({
      isDragging: monitor.isDragging()
    })
  }, [])

  let [{ isOver }, drop] = useDrop(() => ({
    accept: type,
    canDrop,
    hover: handleHover,
    drop: handleDrop,
    collect: (monitor) => ({
      isOver: monitor.isOver()
    })
  }), [])

  useEffect(() => {
    preview(getEmptyImage())
  }, [preview])

  let direction = (isOver && offset != null)
    ? (offset ? 'after' : 'before')
    : null

  return [{
    isDragging,
    isOver,
    direction
  }, isDisabled ? element : drag(drop(element))]
}
