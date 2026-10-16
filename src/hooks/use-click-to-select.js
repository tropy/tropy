import { useRef } from 'react'
import { getKeyState } from '../keymap.js'

// Click to select fires on mouse-down when unselected,
// before drag start and context-menu,
// and on single click (no double clicks!) if selected,
// so that dragging keeps multi-selection!

export function useClickToSelect (props) {
  let wasSelected = useRef(null)
  let handlers = () => clickToSelect(wasSelected, props)

  return {
    onClick: (event) => handlers().onClick(event),
    onMouseDown: (event) => handlers().onMouseDown(event)
  }
}

export const clickToSelect = (wasSelected, {
  isDisabled,
  isSelected,
  onSelect,
  value
}) => ({
  onMouseDown (event) {
    wasSelected.current = null

    if (isDisabled || value == null || event.button > 2) return

    if (isSelected)
      wasSelected.current = { id: value.id ?? value }
    else
      onSelect(value, getKeyState(event))
  },

  onClick (event) {
    // Only the first click of a series (not by keyboard).
    if (!isDisabled && event.detail === 1 && wasSelected.current != null &&
      wasSelected.current.id === (value?.id ?? value))
      onSelect(value, getKeyState(event))
  }
})
