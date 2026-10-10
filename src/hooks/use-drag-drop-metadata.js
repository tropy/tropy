import { useCallback, useEffect } from 'react'
import { useEvent } from './use-event.js'
import { DND, getEmptyImage, useDrag, useDrop } from '../components/dnd.js'
import { auto } from '../format.js'
import { blank } from '../common/util.js'


export function useDragDropMetadata ({
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

  let canDrag = useEvent(() => !(isDisabled || blank(text) || id == null))

  let handleDragEnd = useEvent((item, monitor) => {
    if (monitor.didDrop()) {
      onDragEnd(monitor.getDropResult())
    }
  })

  let [, drag, preview] = useDrag(() => ({
    type: DND.FIELD,
    canDrag,
    item: makeDragItem,
    end: handleDragEnd
  }), [])

  let canDrop = useEvent((item) => (
    !(isDisabled || isReadOnly) &&
    (id === item.id && property !== item.property)
  ))

  let handleDrop = useEvent(() => ({
    id,
    property
  }))

  let [props, drop] = useDrop(() => ({
    accept: DND.FIELD,
    canDrop,
    drop: handleDrop,
    collect: (monitor) => ({
      canDrop: monitor.canDrop(),
      isOver: monitor.isOver()
    })
  }), [])

  useEffect(() => {
    preview(getEmptyImage())
  }, [preview])

  let connect = useCallback((node) => drag(drop(node)), [drag, drop])

  return [props, connect]
}
