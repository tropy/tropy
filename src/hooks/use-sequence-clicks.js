import { useRef } from 'react'
import { clickToEdit, useClickToEditState } from './use-click-to-edit.js'
import { clickToSelect } from './use-click-to-select.js'

function rowIndexOf (event) {
  let row = event.target.closest('[data-index]')

  if (!row || !event.currentTarget.contains(row))
    return -1
  if (!row.dataset.index)
    return -1
  else
    return Number(row.dataset.index)
}

export function useSequenceClicks (cursor, {
  isDisabled,
  isSelected,
  onContextMenu,
  onDoubleClick,
  onSelect,
  onSelectedClick
}) {
  let selectState = useRef(null)

  let isElementSelected = (element) =>
    (isSelected != null)
      ? isSelected(element)
      : (element.id ?? element) === cursor.id

  let editState = useClickToEditState((element, event) => {
    // Subtle: we reach here after the single-click delay,
    // and therefore evaluate the guard one more time!
    if (!isDisabled && isElementSelected(element))
      onSelectedClick(element, event)
  })

  let getElement = (event) =>
    cursor.seq[rowIndexOf(event)] ?? null

  let getElementProps = (event) => {
    let value = getElement(event)

    return {
      isDisabled,
      isSelected: value != null && isElementSelected(value),
      onSelect,
      value
    }
  }

  return {
    onClick (event) {
      let props = getElementProps(event)

      clickToSelect.onClick(selectState, props, event)
      clickToEdit.onClick(editState, {
        ...props,
        isDisabled: isDisabled || !onSelectedClick
      }, event)
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
      let props = getElementProps(event)

      clickToSelect.onMouseDown(selectState, props, event)
      clickToEdit.onMouseDown(editState, props, event)
    }
  }
}
