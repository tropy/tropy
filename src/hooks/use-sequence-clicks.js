import { useClickToEdit } from './use-click-to-edit.js'
import { useClickToSelect } from './use-click-to-select.js'

export function useSequenceClicks ({
  isDisabled,
  isSelected,
  onDoubleClick,
  onSelect,
  onSelectedClick,
  value
}) {
  let select = useClickToSelect({
    isDisabled,
    isSelected,
    onSelect,
    value
  })

  let selectedClick = useClickToEdit({
    isDisabled: isDisabled || !onSelectedClick,
    isSelected,
    onEdit: onSelectedClick,
    value
  })

  return {
    onClick (event) {
      select.onClick(event)
      selectedClick.onClick(event)
    },

    onDoubleClick (event) {
      if (!isDisabled && onDoubleClick)
        onDoubleClick(value, event)
    },

    onMouseDown (event) {
      select.onMouseDown(event)
      selectedClick.onMouseDown(event)
    }
  }
}
