import { useRef } from 'react'
import { useEvent } from './use-event.js'
import { useFocusClick } from './use-focus-click.js'
import { useSingleClick } from './use-single-click.js'
import { hasModifiers } from '../keymap.js'

// Click-to-edit fires when an item:
//  - was already selected
//  - click didn't cause focus change
//  - and is a single click

export function useClickToEdit (handler, { isSelected }) {
  let wasSelected = useRef(false)

  let single = useSingleClick((event) => {
    if (handler) handler(event)
  })

  let focus = useFocusClick(handler && ((event, { hasFocusChanged }) => {
    if (wasSelected.current && !hasFocusChanged && !hasModifiers(event))
      single.onClick(event)
  }))

  let handleMouseDown = useEvent((event) => {
    // Subtle: selection usually happens on mouse-down!
    wasSelected.current = isSelected
    focus.onMouseDown(event)
    single.onMouseDown(event)
  })

  return {
    onClick: focus.onClick,
    onMouseDown: handleMouseDown
  }
}
