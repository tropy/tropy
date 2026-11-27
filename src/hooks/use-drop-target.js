import { useEffect, useState } from 'react'
import { useEvent } from './use-event.js'
import { dropTargetForElements } from '../components/dnd.js'

export function useDropTarget ({
  accept,
  canDrop,
  getDropEffect,
  isDisabled = false,
  onDrag,
  onDrop
}) {
  let [element, setElement] = useState(null)
  let [isOver, setIsOver] = useState(false)

  let handleCanDrop = useEvent((data) =>
    !isDisabled &&
    [accept].flat().includes(data.type) &&
    (canDrop == null || canDrop(data)))

  let handleDropEffect = useEvent((data, input) =>
    getDropEffect?.(data, input) ?? 'move')

  let handleDrag = useEvent((data, input) => {
    onDrag?.(data, { input })
  })

  let handleDrop = useEvent((data, args) => {
    onDrop?.(data, args)
  })

  useEffect(() => {
    if (element == null) return

    return dropTargetForElements({
      element,
      canDrop: ({ source }) => handleCanDrop(source.data),
      getDropEffect: ({ input, source }) =>
        handleDropEffect(source.data, input),
      onDragEnter: () => {
        setIsOver(true)
      },
      onDrag: ({ location, source }) => {
        handleDrag(source.data, location.current.input)
      },
      onDragLeave: () => {
        setIsOver(false)
      },
      onDrop: ({ location, self, source }) => {
        setIsOver(false)

        if (location.current.dropTargets[0]?.element === element)
          handleDrop(source.data, {
            dropEffect: self.dropEffect,
            input: location.current.input
          })
      }
    })
  }, [element, handleCanDrop, handleDropEffect, handleDrag, handleDrop])

  return [{ isOver }, setElement]
}
