import { useRef } from 'react'
import { getKeyState } from '../keymap.js'

// Click to select fires on mouse-down when unselected,
// before drag start and context-menu,
// and on click if selected, so that dragging keeps multi-selection!

export function useClickToSelect ({ isDisabled, isSelected, onSelect, value }) {
  let wasSelected = useRef(false)

  let handleMouseDown = (event) => {
    if (isDisabled || event.button > 2) return

    wasSelected.current = isSelected

    if (!isSelected)
      onSelect(value, getKeyState(event))
  }

  let handleClick = (event) => {
    if (!isDisabled && wasSelected.current)
      onSelect(value, getKeyState(event))
  }

  return {
    onClick: handleClick,
    onMouseDown: handleMouseDown
  }
}
