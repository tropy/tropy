import { useEffect, useState } from 'react'
import { DND, useDrag, useDrop, getEmptyImage } from '../components/dnd.js'
import { Thumbnail } from '../components/photo/thumbnail.js'
import { bounds } from '../dom.js'
import { pick } from '../common/util.js'

export function useDragDropSelection({
  container,
  photo,
  selection,
  isVertical,
  canDrag,
  getAdjacent,
  onDropSelection
}) {
  let [offset, setOffset] = useState(null)

  let [{ isDragging }, drag, preview] = useDrag(() => ({
    type: DND.SELECTION,
    item() {
      return {
        ...pick(selection, Thumbnail.keys),
        id: selection.id,
        photo: selection.photo,
        color: photo.color,
        mimetype: photo.mimetype,
        orientation: photo.orientation,
        adj: getAdjacent(selection)
      }
    },
    canDrag: () => canDrag,
    end(item, monitor) {
      let result = monitor.didDrop() && monitor.getDropResult()

      if (!result) return
      if (result.id === result.to) return
      if (result.offset == null) return

      onDropSelection(result)
    },
    collect: (monitor) => ({
      isDragging: monitor.isDragging()
    })
  }), [selection, photo, canDrag, getAdjacent, onDropSelection])

  let [{ isOver }, drop] = useDrop(() => ({
    accept: DND.SELECTION,
    canDrop: (item) => photo.id === item.photo,
    hover(item, monitor) {
      let { id, adj } = item
      let { top, left, width, height } = bounds(container.current)
      let { x, y } = monitor.getClientOffset()

      let newOffset = null

      if (selection.id !== id) {
        newOffset = Math.round(
          isVertical ? ((y - top) / height) : ((x - left) / width)
        )

        if (adj[1 - newOffset] === selection.id) {
          newOffset = null
        }
      }

      setOffset(newOffset)
    },
    drop(item) {
      try {
        return {
          id: item.id,
          to: selection.id,
          offset
        }
      } finally {
        setOffset(null)
      }
    },
    collect: (monitor) => ({
      isOver: monitor.isOver()
    })
  }), [container, photo.id, selection.id, isVertical, offset])

  useEffect(() => {
    preview(getEmptyImage())
  }, [preview])

  return { isDragging, isOver, offset, drag, drop }
}
