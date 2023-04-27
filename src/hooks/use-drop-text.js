import { useDrop } from 'react-dnd'
import { NativeTypes } from 'react-dnd-html5-backend'

export function useDropText({ onDrop }) {
  return useDrop(() => ({
    accept: [NativeTypes.TEXT, NativeTypes.URL],

    drop(item) {
      onDrop(item.text || item.urls[0])
    },

    collect: (monitor) => ({
      isOver: monitor.isOver()
    })
  }), [onDrop])
}
