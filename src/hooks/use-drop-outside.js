import { useEvent } from './use-event.js'
import { useDrop } from '../components/dnd.js'

export function useDropOutside ({
  type,
  canDrop,
  items,
  onDrop
}) {
  let handleDrop = useEvent((item, monitor) => {
    if (monitor.didDrop()) return

    let to = items.at(-1)
    if (item.id !== to) {
      onDrop({ id: item.id, to, offset: 1 })
    }
  })

  return useDrop(() => ({
    accept: type,
    canDrop,
    drop: handleDrop,
    collect: (monitor) => ({
      isOver: monitor.isOver({ shallow: true })
    })
  }), [])
}
