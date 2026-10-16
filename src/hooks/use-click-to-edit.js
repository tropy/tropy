import { useRef } from 'react'
import { useEvent } from './use-event.js'
import { useFocusClick } from './use-focus-click.js'
import { useSingleClick } from './use-single-click.js'
import { hasModifiers } from '../keymap.js'

// Click-to-edit fires when an item:
//  - was already selected
//  - click didn't cause focus change
//  - and is a single click

export function useClickToEdit (props) {
  let { isDisabled, isSelected, onEdit } = props

  let state = useClickToEditState((value, event) => {
    // Subtle: check conditions again after the delay!
    if (!isDisabled && isSelected) onEdit(value, event)
  })

  return {
    onClick (event) {
      clickToEdit.onClick(state, props, event)
    },
    onMouseDown (event) {
      clickToEdit.onMouseDown(state, props, event)
    }
  }
}

export function useClickToEditState (onEdit) {
  let wasSelected = useRef(null)
  let pending = useRef(null)

  let single = useSingleClick(useEvent((event) => {
    let value = pending.current
    pending.current = null
    onEdit(value, event)
  }))

  let focus = useFocusClick((event, { hasFocusChanged }) => {
    if (!hasFocusChanged) single.onClick(event)
  })

  return { focus, pending, single, wasSelected }
}

export const clickToEdit = {
  onMouseDown ({ focus, single, wasSelected }, { isSelected, value }, event) {
    // Subtle: selection usually happens on mouse-down!
    wasSelected.current = (isSelected && value != null)
      ? { id: value.id ?? value }
      : null

    focus.onMouseDown(event)
    single.onMouseDown(event)
  },

  onClick ({ focus, pending, wasSelected }, { isDisabled, value }, event) {
    if (isDisabled || hasModifiers(event))
      return
    if (wasSelected.current == null ||
      wasSelected.current.id !== (value?.id ?? value))
      return

    pending.current = value
    focus.onClick(event)
  }
}
