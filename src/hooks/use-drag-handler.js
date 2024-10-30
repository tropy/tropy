import { useRef } from 'react'
import { useEvent } from './use-event.js'
import { on, off, toggle } from '../dom.js'

export function useDragHandler({
  onClick,
  onDrag,
  onDragStart,
  onDragStop,
  stopOnMouseLeave = true
}) {
  let status = useRef(null)

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
    status.current = null
  })

  let handleDragStart = useEvent((event) => {
    status.current.isDragging = true
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

    onDragStart?.(event, ...status.current.args)
  })

  let handleClick = useEvent((event) => {
    onClick?.(event, ...status.current.args)
    status.current = null
  })

  let handleClickOrDragStart = useEvent((event) => {
    off(document, 'mousemove', handleClickOrDragStart, { capture: true })
    off(document, 'mouseup', handleClickOrDragStart, { capture: true })

    status.current.isPending = false

    if (event.type === 'mouseup')
      handleClick(event)
    else
      handleDragStart(event)
  })

  return useEvent((event, ...args) => {
    if (status.current?.isDragging)
      handleDragStop()
    if (status.current?.isPending) {
      off(document, 'mousemove', handleClickOrDragStart, { capture: true })
      off(document, 'mouseup', handleClickOrDragStart, { capture: true })
    }

    // Handle only clicks with the left/primary button!
    if (event.button !== 0)
      return

    status.current = { isPending: true, args }

    on(document, 'mousemove', handleClickOrDragStart, { capture: true })
    on(document, 'mouseup', handleClickOrDragStart, { capture: true })
  })
}
