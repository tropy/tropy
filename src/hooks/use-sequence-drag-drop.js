import { useEffect, useRef, useState } from 'react'
import { useEvent } from './use-event.js'
import {
  draggable,
  dropTargetForElements,
  getDropPosition,
  isNoopMove
} from '../components/dnd.js'
import { renderDragImage } from '../components/drag-image-portal.js'
import { bounds, isInput } from '../dom.js'
import { adjacent } from '../common/sequence.js'
import { move } from '../common/util.js'

// The containers of all sequences, so that the leaves of a nested
// sequence (the selection grid in the photo grid) are its own.
let containers = new WeakSet()

let ownerOf = (leaf) => {
  for (let node = leaf.parentElement; node != null; node = node.parentElement)
    if (containers.has(node)) return node

  return null
}

// Drag and drop for a sequence (the ids in order),
// delegated to its container: leaves are found by their data-index
// and registered as draggable only when pressed
// (pointerdown, for any pointer type, comes before dragstart),
// so leaves mount and unmount without any registration;
// one drop target on the container.
// Without options it does nothing.
//
// getData(id): the pressed leaf's drag data ({ type, id, ... }),
// null if it cannot be dragged; preview(data): the element for
// the native drag image (none: the browser's snapshot of the leaf).
// accept, canDrop(data, id), onDrop(data, id): drops onto a leaf.
// sort: { accept, canSort(data, id), getOrder(data), onSort(order, data) }:
// drops before or after a leaf (along x in grids), or past the last
// leaf to the end of the order (default seq); data.id is moved.
export function useSequenceDragDrop (seq, {
  accept = [],
  canDrop,
  getData,
  isDisabled = false,
  isGrid = false,
  onDragStart,
  onDrop,
  preview,
  sort
} = {}) {
  let [container, setContainer] = useState(null)
  let [source, setSource] = useState(null)
  let [over, setOver] = useState(null)

  // The registered leaf's cleanup.
  let pressed = useRef(null)

  let isTarget = !isDisabled &&
    [accept, sort?.accept ?? []].flat().length > 0

  useEffect(() => {
    if (container == null) return

    containers.add(container)
    return () => { containers.delete(container) }
  }, [container])

  let leafOf = (node) => {
    let leaf = node?.closest?.('[data-index]')
    return (leaf != null && ownerOf(leaf) === container) ? leaf : null
  }

  let idOf = (leaf) =>
    (leaf == null) ? null : (seq[Number(leaf.dataset.index)] ?? null)

  let getOrder = (data) =>
    sort.getOrder?.(data) ?? seq

  let isDroppable = (data, id) =>
    [accept].flat().includes(data.type) &&
    (canDrop == null || canDrop(data, id))

  let isSortable = (data, id) =>
    sort != null &&
    [sort.accept].flat().includes(data.type) &&
    (sort.canSort == null || sort.canSort(data, id))

  // Where a drag at the input would drop: { id, position }
  // (position: on, before, after, or end, past the last leaf),
  // or null.
  let targetAt = useEvent(({ clientX, clientY }, data) => {
    let leaf = leafOf(document.elementFromPoint(clientX, clientY))
    let id = idOf(leaf)

    if (id == null) {
      if (leaf != null || sort == null) return null

      let last = getOrder(data).at(-1)
      return (last != null && last !== data.id && isSortable(data, last))
        ? { id: last, position: 'end' }
        : null
    }

    let on = isDroppable(data, id)

    if (!isSortable(data, id))
      return on ? { id, position: 'on' } : null

    let position = getDropPosition(
      { x: clientX, y: clientY },
      bounds(leaf),
      { isGrid, on })

    if (position !== 'on' && isNoopMove(position, {
      id: data.id,
      target: id,
      adjacent: adjacent(getOrder(data), data.id)
    })) return null

    return { id, position }
  })

  let handleDrop = useEvent((data, { id, position }) => {
    if (position === 'on')
      onDrop?.(data, id)
    else
      sort.onSort(
        move(getOrder(data), data.id, id, (position === 'before') ? 0 : 1),
        data)
  })

  let handleGetData = useEvent((id) => getData(id))

  let handlePreview = useEvent(({ nativeSetDragImage, source }) => {
    if (preview != null)
      renderDragImage({
        element: preview(source.data),
        nativeSetDragImage
      })
  })

  let handleDragStart = useEvent((data) => {
    onDragStart?.(data)
  })

  useEffect(() => {
    if (container == null || !isTarget) return

    return dropTargetForElements({
      element: container,
      canDrop: ({ input, source }) =>
        targetAt(input, source.data) != null,
      getData: ({ input, source }) =>
        targetAt(input, source.data),
      onDrag: ({ self }) => {
        setOver(o => (o?.id === self.data.id && o.position === self.data.position)
          ? o
          : self.data)
      },
      onDragLeave: () => {
        setOver(null)
      },
      onDrop: ({ location, self, source }) => {
        setOver(null)

        if (location.current.dropTargets[0]?.element === container)
          handleDrop(source.data, self.data)
      }
    })
  }, [container, isTarget, targetAt, handleDrop])

  useEffect(() => () => {
    pressed.current?.()
  }, [])

  let onPointerDown = (event) => {
    pressed.current?.()
    pressed.current = null

    // Presses in inputs select text, they do not drag.
    if (isDisabled || getData == null || isInput(event.target)) return

    let leaf = leafOf(event.target)
    let id = idOf(leaf)
    if (id == null || getData(id) == null) return

    pressed.current = draggable({
      element: leaf,
      getInitialData: () => handleGetData(id),
      onGenerateDragPreview: handlePreview,
      onDragStart: ({ source }) => {
        setSource({ id, data: source.data })
        handleDragStart(source.data)
      },
      onDrop: () => {
        setSource(null)
      }
    })
  }

  // direction: before or after, when sorting
  // (after the last leaf for drops past it).
  // canDrop: false for the leaves a drag from this sequence
  // cannot drop on (onto or sorted next to them), else true
  // (so only those leaves re-render when the drag starts and ends).
  let getLeafProps = (id) => {
    let isOver = id === over?.id

    return {
      canDrop: source == null ||
        isDroppable(source.data, id) ||
        isSortable(source.data, id),
      direction: !isOver || over.position === 'on'
        ? null
        : (over.position === 'before') ? 'before' : 'after',
      isDragging: id === source?.id,
      isOver
    }
  }

  return {
    getLeafProps,
    onPointerDown,
    setContainer
  }
}
