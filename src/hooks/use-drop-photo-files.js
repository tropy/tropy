import { useDrop } from 'react-dnd'
import { NativeTypes } from 'react-dnd-html5-backend'
import { getDroppedFiles, hasPhotoFiles } from '../components/dnd.js'

export function useDropPhotoFiles({ onDrop, isReadOnly = false }) {
  return useDrop(() => ({
    accept: [NativeTypes.FILE, NativeTypes.URL],

    drop(item) {
      let photos = getDroppedFiles(item)

      if (photos) {
        onDrop(photos)
        return photos
      }
    },

    canDrop(item, monitor) {
      if (isReadOnly)
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
    },

    collect: (monitor) => ({
      isOver: monitor.isOver(),
      canDrop: monitor.canDrop()
    })
  }), [onDrop, isReadOnly])
}
