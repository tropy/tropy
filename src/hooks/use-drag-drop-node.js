import { useEffect, useRef, useState } from 'react'
import { useEvent } from './use-event.js'
import { DND, getEmptyImage, useDrag, useDrop } from '../components/dnd.js'
import { bounds } from '../dom.js'
import { restrict } from '../common/util.js'

const getDirection = (current, {
  depth,
  isExpanded,
  isLastChild,
  minDropDepth
}) => {
  if (current.offset == null)
    return null
  if (current.offset < 1)
    return 'before'
  if (isLastChild && !isExpanded && current.depth < depth)
    return [
      'after',
      `depth-${depth - restrict(current.depth, minDropDepth, depth)}`
    ]
  else
    return 'after'
}

export function useDragDropNode(dom, {
  depth = 0,
  icon,
  indent = 0,
  isDraggingParent,
  isExpanded,
  isLastChild,
  isReadOnly = false,
  minDropDepth = 0,
  node,
  onDrop,
  onDropOutside,
  padding = 0,
  position = 0
}) {
  let dragging = useRef({ offset: null, depth: null })
  let [direction, setDirection] = useState(null)

  let handleDrop = useEvent((item) => {
    try {
      let { offset, depth: dropDepth } = dragging.current

      // Drop into or after an expanded node
      if (offset == null || (offset === 1 && isExpanded)) {
        return onDrop({
          id: item.id,
          parent: node.id
        }, { idx: 0 })
      }

      dropDepth = restrict(dropDepth, minDropDepth, depth)

      // Drop outside/after last node
      if (isLastChild && offset === 1 && dropDepth < depth) {
        return onDropOutside({
          id: item.id,
          parent: node.id,
          depth: 1 + depth - dropDepth
        })
      }

      let idx = (node.parent !== item.parent || position < item.idx)
        ? position + offset
        : position - 1 + offset

      return onDrop({
        id: item.id,
        parent: node.parent
      }, { idx })
    } finally {
      setDirection(null)
      dragging.current.depth = null
      dragging.current.offset = null
    }
  })

  let handleHover = useEvent((item, monitor) => {
    let { left, top, height } = bounds(dom.current)
    let { x, y } = monitor.getClientOffset()
    let offset = (y - top) / height

    Object.assign(dragging.current, {
      depth: restrict(Math.round((x - left - padding) / indent), 0, depth),
      offset: (offset < 0.33) ? 0 : (offset > 0.67) ? 1 : null
    })

    setDirection(getDirection(dragging.current, {
      depth,
      isExpanded,
      isLastChild,
      minDropDepth
    }))
  })

  let canDragNode = useEvent(() => {
    return !isReadOnly
  })

  let canDropNode = useEvent(() => {
    return !(isDraggingParent || isDragging)
  })

  let createDragItem = useEvent(() => ({
    icon,
    id: node.id,
    idx: position,
    name: node.name,
    padding: padding + indent * depth,
    parent: node.parent,
    position: 'relative'
  }))

  let [{ isDragging }, drag, preview] = useDrag({
    type: DND.NODE,
    canDrag: canDragNode,
    item: createDragItem,
    collect: (monitor) => ({
      isDragging: monitor.isDragging()
    })
  }, [])

  let [{ canDrop, isOver }, drop] = useDrop(() => ({
    accept: DND.NODE,
    drop: handleDrop,
    hover: handleHover,
    canDrop: canDropNode,
    collect: (monitor) => ({
      canDrop: monitor.canDrop(),
      isOver: monitor.isOver()
    })
  }), [])

  useEffect(() => {
    preview(getEmptyImage())
  }, [preview])

  return [{
    canDrop,
    direction: isOver ? direction : null,
    isDragging,
    isOver
  }, drag(drop(dom))]
}
