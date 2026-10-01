import { useRef } from 'react'
import { useEvent } from './use-event.js'
import { isMeta } from '../keymap.js'

export function useItemClickHandler (item, {
  isSelected,
  onContextMenu,
  onOpen,
  onSelect
}) {
  let wasSelected = useRef(false)

  let select = useEvent((event) => {
    if (!(event.button > 2)) {
      onSelect(item, {
        isMeta: isMeta(event),
        isRange: event.shiftKey
      })
    }
  })

  // Subtle: when an item is not selected,
  // we need to select on mouse-down,
  // because the mouse-down may kick-off a drag event.
  // If the item is already selected,
  // we handle selection in the click event for the same reason!
  let handleMouseDown = useEvent((event) => {
    wasSelected.current = isSelected
    if (!isSelected) select(event)
  })

  let handleClick = useEvent((event) => {
    if (isSelected && wasSelected.current) select(event)
  })

  let handleDoubleClick = useEvent(() => {
    onOpen(item)
  })

  let handleContextMenu = useEvent((event) => {
    if (!isSelected) select(event)
    onContextMenu(event, item)
  })

  return {
    onClick: handleClick,
    onContextMenu: handleContextMenu,
    onDoubleClick: handleDoubleClick,
    onMouseDown: handleMouseDown
  }
}
