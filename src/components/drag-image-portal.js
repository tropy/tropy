import { useEffect, useState } from 'react'
import { createPortal, flushSync } from 'react-dom'
import { setCustomNativeDragPreview } from './dnd.js'
import { bounds } from '../dom.js'

// Native drag images rendered by React:
// the browser snapshots an element at dragstart.
let show = null

export function DragImagePortal () {
  let [preview, setPreview] = useState(null)

  useEffect(() => {
    show = setPreview

    return () => {
      if (show === setPreview) show = null
    }
  }, [])

  return preview && createPortal(preview.element, preview.container)
}

export function renderDragImage ({
  element,
  nativeSetDragImage,
  offset
}) {
  if (show == null) return

  setCustomNativeDragPreview({
    nativeSetDragImage,

    getOffset: ({ container }) => {
      if (offset != null) return offset

      let { width, height } = bounds(container)
      return { x: width / 2, y: height / 2 }
    },

    render: ({ container }) => {
      flushSync(() => {
        show({ container, element })
      })

      return () => { show?.(null) }
    }
  })
}
