import { useRef } from 'react'
import { getKeyState } from '../keymap.js'

// Click to select fires on mouse-down when unselected,
// before drag start and context-menu,
// and on single click (no double clicks!) if selected,
// so that dragging keeps multi-selection!

export function useClickToSelect (props) {
  let wasSelected = useRef(null)

  return {
    onClick (event) {
      clickToSelect.onClick(wasSelected, props, event)
    },
    onMouseDown (event) {
      clickToSelect.onMouseDown(wasSelected, props, event)
    }
  }
}

export const clickToSelect = {
  onMouseDown (
    wasSelected,
    { isDisabled, isSelected, onSelect, value },
    event
  ) {
    wasSelected.current = null

    if (isDisabled || value == null || event.button > 2) return

    if (isSelected)
      wasSelected.current = { id: value.id ?? value }
    else
      onSelect(value, getKeyState(event))
  },

  onClick (wasSelected, { isDisabled, onSelect, value }, event) {
    // Only the first click of a series (not by keyboard).
    if (!isDisabled && event.detail === 1 && wasSelected.current != null &&
      wasSelected.current.id === (value?.id ?? value))
      onSelect(value, getKeyState(event))
  }
}
