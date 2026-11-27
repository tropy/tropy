import { useEffect, useState } from 'react'
import { useEvent } from './use-event.js'
import { draggable } from '../components/dnd.js'
import { renderDragImage } from '../components/drag-image-portal.js'
import { bounds } from '../dom.js'

export function useDragSource ({
  getData,
  isDisabled = false,
  preview,
  previewOffset = 'center',
  onDragStart,
  onDrop
}) {
  let [element, setElement] = useState(null)
  let [isDragging, setIsDragging] = useState(false)

  let getInitialData = useEvent(() => getData())

  let handlePreview = useEvent(({ location, nativeSetDragImage, source }) => {
    if (preview == null) return

    let offset

    if (previewOffset === 'grab') {
      let { left, top } = bounds(source.element)
      let { clientX, clientY } = location.current.input
      offset = { x: clientX - left, y: clientY - top }
    }

    renderDragImage({
      element: preview(source.data),
      nativeSetDragImage,
      offset
    })
  })

  let handleDragStart = useEvent(({ source }) => {
    setIsDragging(true)
    onDragStart?.(source.data)
  })

  let handleDrop = useEvent((args) => {
    setIsDragging(false)
    onDrop?.(args.source.data, args.location.current.dropTargets)
  })

  // Registered only when enabled: registering makes the element
  // natively draggable (Pragmatic sets draggable="true").
  useEffect(() => {
    if (element == null || isDisabled) return

    return draggable({
      element,
      getInitialData,
      onGenerateDragPreview: handlePreview,
      onDragStart: handleDragStart,
      onDrop: handleDrop
    })
  }, [element, isDisabled, getInitialData, handlePreview, handleDragStart, handleDrop])

  return [{ isDragging }, setElement]
}
