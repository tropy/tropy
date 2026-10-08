import { useRef } from 'react'

export function useFocusClick (handler) {
  let activeElement = useRef(null)
  let hadFocus = useRef(false)

  let handleMouseDown = (event) => {
    activeElement.current = new WeakRef(document.activeElement)
    hadFocus.current = event.currentTarget.contains(document.activeElement)
  }

  let handleClick = (event) => {
    if (!handler) return

    let isPointer = event.detail > 0

    handler(event, {
      hadFocus: isPointer
        ? hadFocus.current
        : event.currentTarget.contains(document.activeElement),
      hasFocusChanged: isPointer &&
        activeElement.current?.deref() !== document.activeElement
    })
  }

  return {
    onClick: handleClick,
    onMouseDown: handleMouseDown
  }
}
