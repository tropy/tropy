import { useDrop } from 'react-dnd'
import { DND } from '../components/dnd.js'

export function useDropItems({ onDrop, isReadOnly = false }) {
  return useDrop(() => ({
    accept: DND.ITEMS,

    drop(item) {
      onDrop(item.items)
    },

    canDrop() {
      return !isReadOnly
    },

    collect: (monitor) => ({
      isOver: monitor.isOver(),
      canDrop: monitor.canDrop()
    })
  }), [onDrop, isReadOnly])
}
