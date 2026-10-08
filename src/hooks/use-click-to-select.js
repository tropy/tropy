import { useRef } from 'react'
import { getKeyState } from '../keymap.js'

// Click to select fires on mouse-down when unselected,
// before drag start and context-menu,
// and on single click (no double clicks!) if selected,
// so that dragging keeps multi-selection!

export function useClickToSelect ({ isDisabled, isSelected, onSelect, value }) {
  let wasSelected = useRef(false)

  let handleMouseDown = (event) => {
    if (isDisabled || event.button > 2) return

    wasSelected.current = isSelected

    if (!isSelected)
      onSelect(value, getKeyState(event))
  }

  let handleClick = (event) => {
    // Only the first click of a series (not by keyboard).
    if (!isDisabled && wasSelected.current && event.detail === 1)
      onSelect(value, getKeyState(event))
  }

  return {
    onClick: handleClick,
    onMouseDown: handleMouseDown
  }
}
