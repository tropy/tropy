import { useEffect, useRef } from 'react'
import { useEvent } from './use-event.js'
import { on, off, toggle } from '../dom.js'

export function useDragHandler({
  onDrag,
  onDragStart,
  onDragStop,
  stopOnMouseLeave = true
}) {
  let isDragging = useRef(false)

  let handleKeyDown = useEvent((event) => {
    switch (event.key) {
      case 'Escape':
        event.stopPropagation()
        event.stopImmediatePropagation()
        handleDragStop(event)
        break
    }
  })

  let handleDrag = useEvent((event) => {
    if (event.buttons === 0) {
      handleDragStop(event)
    } else {
      onDrag?.(event)
    }
  })

  let handleDragStop = useEvent((event) => {
    off(document, 'mousemove', handleDrag)
    off(document, 'mouseup', handleDragStop, { capture: true })
    off(window, 'blur', handleDragStop)

    off(document.body, 'mouseleave', handleDragStop)
    off(document.body, 'keydown', handleKeyDown)

    let wasCancelled = !(
      event?.type === 'mouseup' || event?.type === 'mousemove'
    )

    onDragStop?.(event, wasCancelled)

    toggle(document.documentElement, 'dragging', false)
    isDragging.current = false
  })

  useEffect(() => () => {
    if (isDragging.current) handleDragStop()
  }, [handleDragStop])

  return useEvent((event, ...args) => {
    // Handle only clicks with the left/primary button!
    if (event.button !== 0)
      return

    if (isDragging.current)
      handleDragStop()

    isDragging.current = true
    toggle(document.documentElement, 'dragging', true)

    on(document, 'mousemove', handleDrag)
    on(document, 'mouseup', handleDragStop, { capture: true })
    on(window, 'blur', handleDragStop)

    if (stopOnMouseLeave) {
      on(document.body, 'mouseleave', handleDragStop)
    }

    // Register on body because global bindings are bound
    // on document and we need to stop the propagation in
    // case we handle it here!
    on(document.body, 'keydown', handleKeyDown)

    onDragStart?.(event, ...args)
  })
}
