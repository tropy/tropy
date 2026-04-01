import { useEffect, useState } from 'react'
import { throttle } from '../common/util.js'
import { on, off } from '../dom.js'


export function useDropEffect () {
  let [dropEffect, setDropEffect] = useState('none')

  useEffect(() => {
    let handleDragOver = throttle((event) => {
      setDropEffect(event.dataTransfer.dropEffect)
    }, 100)

    on(window, 'dragover', handleDragOver, { passive: true })

    return () => {
      off(window, 'dragover', handleDragOver, { passive: true })
    }
  }, [])

  return dropEffect
}
