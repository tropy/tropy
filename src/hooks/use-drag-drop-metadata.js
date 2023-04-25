import { useEffect } from 'react'
import { useEvent } from './use-event.js'
import { DND, getEmptyImage, useDrag, useDrop } from '../components/dnd.js'
import { auto } from '../format.js'
import { blank } from '../common/util.js'


export function useDragDropMetadata({
  id,
  isDisabled,
  isMixed,
  isReadOnly,
  property,
  text,
  type,
  onDragEnd
}) {
  let makeDragItem = useEvent(() => ({
    id,
    isMixed,
    position: 'relative',
    property,
    value: auto(text, type)
  }))

  let canDrag = useEvent(() => !(isDisabled || blank(text)))

  let [, drag, preview] = useDrag({
    type: DND.FIELD,
    canDrag,
    item: makeDragItem,
    end(item, monitor) {
      if (monitor.didDrop()) {
        onDragEnd(monitor.getDropResult())
      }
    }
  }, [onDragEnd])

  let canDrop = useEvent((item) => (
    !(isDisabled || isReadOnly) &&
      (id === item.id && property !== item.property)
  ))

  let [collectedProps, drop] = useDrop(() => ({
    accept: DND.FIELD,
    canDrop,
    drop: () => ({
      id,
      property
    }),
    collect: (monitor) => ({
      isOver: monitor.canDrop() && monitor.isOver()
    })
  }), [id, property])

  useEffect(() => {
    preview(getEmptyImage())
  }, [preview])

  return [collectedProps, (node) => drag(drop(node))]
}
