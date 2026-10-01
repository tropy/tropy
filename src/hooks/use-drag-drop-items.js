import { useDrop } from 'react-dnd'
import { useEvent } from './use-event.js'
import { DND } from '../components/dnd.js'

export function useDropItems ({ onDrop, canDrop, isDisabled = false }) {
  let handleDrop = useEvent((item) => {
    onDrop(item.items)
  })

  let handleCanDrop = useEvent((item, monitor) =>
    !isDisabled && (canDrop == null || canDrop(item, monitor)))

  return useDrop(() => ({
    accept: DND.ITEMS,
    drop: handleDrop,
    canDrop: handleCanDrop,
    collect: (monitor) => ({
      isOver: monitor.isOver(),
      canDrop: monitor.canDrop()
    })
  }), [])
}
