import { useRef } from 'react'
import { clickToEdit, useClickToEditState } from './use-click-to-edit.js'
import { clickToSelect } from './use-click-to-select.js'

// Clicks on the elements of the cursor's sequence, by delegation:
// the handlers go on a node containing the rows,
// each row carries its index in the sequence (`data-index`).
//
// The same gestures as useElementClicks, for the element
// of each event; elements are selected if at the cursor,
// unless `isSelected` says.

export function useSequenceClicks (cursor, {
  isDisabled,
  isSelected,
  onContextMenu,
  onDoubleClick,
  onSelect,
  onSelectedClick
}) {
  let selectState = useRef(null)

  let isElementSelected = (element) => (isSelected != null)
    ? isSelected(element)
    : (element.id ?? element) === cursor.id

  let editState = useClickToEditState((element, event) => {
    // Subtle: we reach here after the single-click delay,
    // and therefore evaluate the guard one more time!
    if (!isDisabled && isElementSelected(element))
      onSelectedClick(element, event)
  })

  let getElement = (event) => {
    let row = event.target.closest('[data-index]')

    return (row != null && event.currentTarget.contains(row))
      ? cursor.seq[row.dataset.index] ?? null
      : null
  }

  let getHandlers = (event) => {
    let value = getElement(event)
    let isValueSelected = value != null && isElementSelected(value)

    return [
      clickToSelect(selectState, {
        isDisabled,
        isSelected: isValueSelected,
        onSelect,
        value
      }),
      clickToEdit(editState, {
        isDisabled: isDisabled || !onSelectedClick,
        isSelected: isValueSelected,
        value
      })
    ]
  }

  return {
    onClick (event) {
      for (let handlers of getHandlers(event))
        handlers.onClick(event)
    },

    onContextMenu (event) {
      let element = getElement(event)

      if (element != null)
        onContextMenu?.(event, element)
    },

    onDoubleClick (event) {
      let element = getElement(event)

      if (!isDisabled && element != null)
        onDoubleClick?.(element, event)
    },

    onMouseDown (event) {
      for (let handlers of getHandlers(event))
        handlers.onMouseDown(event)
    }
  }
}
