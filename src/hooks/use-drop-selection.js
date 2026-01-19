import { useDrop } from 'react-dnd'
import { DND } from '../components/dnd.js'

export function useDropSelection({ photo, isSortable }) {
  return useDrop(() => ({
    accept: DND.SELECTION,

    canDrop(item) {
      return isSortable && photo.id === item.photo
    },

    drop(item, monitor) {
      if (monitor.didDrop()) return

      let { id } = item
      let { selections } = photo
      let to = selections[selections.length - 1]

      if (id !== to) {
        return { id, to, offset: 1 }
      }
    },

    collect: (monitor) => ({
      isOver: monitor.isOver({ shallow: true })
    })
  }), [photo.id, photo.selections, isSortable])
}
