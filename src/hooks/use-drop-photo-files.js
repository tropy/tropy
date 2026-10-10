import { useDrop } from 'react-dnd'
import { NativeTypes } from 'react-dnd-html5-backend'
import { useEvent } from './use-event.js'
import { getDroppedFiles, hasPhotoFiles } from '../components/dnd.js'

export function useDropPhotoFiles ({ onDrop, isDisabled = false }) {
  let handleDrop = useEvent((item) => {
    let photos = getDroppedFiles(item)

    if (photos) {
      onDrop(photos)
      return photos
    }
  })

  let handleCanDrop = useEvent((item, monitor) => {
    if (isDisabled)
      return false

    switch (monitor.getItemType()) {
      case NativeTypes.FILE:
        return hasPhotoFiles(item)
      case NativeTypes.URL:
        // Currently, Tropy only support importing photos via URLs,
        // so here we don't inspecting it further.
        return true
      default:
        return false
    }
  })

  return useDrop(() => ({
    accept: [NativeTypes.FILE, NativeTypes.URL],
    drop: handleDrop,
    canDrop: handleCanDrop,
    collect: (monitor) => ({
      isOver: monitor.isOver(),
      canDrop: monitor.canDrop()
    })
  }), [])
}
