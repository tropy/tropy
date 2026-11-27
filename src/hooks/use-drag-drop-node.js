import { useRef, useState } from 'react'
import { useDragSource } from './use-drag-source.js'
import { useDropTarget } from './use-drop-target.js'
import { getDropDepth, getDropPosition } from '../components/dnd.js'
import { NodeDragPreview } from '../components/tree/node-drag-preview.js'
import { bounds } from '../dom.js'
import { restrict } from '../common/util.js'

const getDropIndicator = (current, {
  depth,
  isExpanded,
  isLastChild,
  minDropDepth
}) => {
  if (current.offset == null)
    return null
  if (current.offset < 1)
    return 'before'
  // A string, so equal indicators do not change the state
  // (set once per frame while hovering).
  if (isLastChild && !isExpanded && current.depth < depth)
    return `after depth-${depth - restrict(current.depth, minDropDepth, depth)}`
  else
    return 'after'
}

// A tree node that drags (to move it in the tree)
// and takes drops of nodes (before, inside, after; the depth
// from the pointer's x after the last child) and of items
// (onDropItems): one drop target for both (Pragmatic keeps
// one per element). Returns its state and a ref for the node's
// element (a callback).
export function useDragDropNode ({
  depth = 0,
  icon,
  indent = 0,
  isDisabled = false,
  isDraggingParent,
  isExpanded,
  isLastChild,
  minDropDepth = 0,
  node,
  onDrop,
  onDropItems,
  onDropOutside,
  padding = 0,
  position = 0
}) {
  let elementRef = useRef(null)
  let dragging = useRef({ offset: null, depth: null })
  let [indicator, setDropIndicator] = useState(null)

  let handleDropNode = (item) => {
    let { offset, depth: dropDepth } = dragging.current

    setDropIndicator(null)
    dragging.current.depth = null
    dragging.current.offset = null

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
  }

  let handleHoverNode = ({ clientX, clientY }) => {
    let point = { x: clientX, y: clientY }
    let rect = bounds(elementRef.current)
    let at = getDropPosition(point, rect, { on: true })

    Object.assign(dragging.current, {
      depth: getDropDepth(point, rect, { depth, indent, padding }),
      offset: (at === 'before') ? 0 : (at === 'after') ? 1 : null
    })

    setDropIndicator(getDropIndicator(dragging.current, {
      depth,
      isExpanded,
      isLastChild,
      minDropDepth
    }))
  }

  let [{ isDragging }, drag] = useDragSource({
    isDisabled,
    getData: () => ({
      type: 'node',
      icon,
      id: node.id,
      idx: position,
      name: node.name,
      padding: padding + indent * depth,
      parent: node.parent
    }),
    preview: (data) => <NodeDragPreview item={data}/>,
    previewOffset: 'grab'
  })

  let [{ isOver }, drop] = useDropTarget({
    accept: ['node', 'items'],
    isDisabled,
    canDrop: (data) =>
      data.type !== 'node' || !(isDraggingParent || isDragging),
    onDrag: (data, { input }) => {
      if (data.type === 'node') handleHoverNode(input)
    },
    onDrop: (data) => {
      if (data.type === 'node')
        handleDropNode(data)
      else
        onDropItems(data.items)
    }
  })

  // No indicator left behind when the drag leaves.
  if (!isOver && indicator != null)
    setDropIndicator(null)

  let connect = (element) => {
    elementRef.current = element
    drag(element)
    drop(element)
  }

  return [{
    dropIndicator: isOver ? indicator : null,
    isDragging,
    isOver
  }, connect]
}
