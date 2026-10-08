import { useRef } from 'react'
import { useEvent } from './use-event.js'

export function useFocusClick (handler) {
  let activeElement = useRef(null)
  let hadFocus = useRef(false)

  let handleMouseDown = useEvent((event) => {
    activeElement.current = new WeakRef(document.activeElement)
    hadFocus.current = event.currentTarget.contains(document.activeElement)
  })

  let handleClick = useEvent((event) => {
    if (!handler) return

    let isPointer = event.detail > 0

    handler(event, {
      hadFocus: isPointer
        ? hadFocus.current
        : event.currentTarget.contains(document.activeElement),
      hasFocusChanged: isPointer &&
        activeElement.current?.deref() !== document.activeElement
    })
  })

  return {
    onClick: handleClick,
    onMouseDown: handleMouseDown
  }
}
