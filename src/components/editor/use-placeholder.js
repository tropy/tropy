import { useEffect, useRef } from 'react'
import { useEvent } from '../../hooks/use-event.js'
import { create } from '../../dom.js'

// The placeholder in the editor's document: shown while it is blank.
// Returns the function that mounts it into a (newly loaded) document.
export const usePlaceholder = ({ text, isVisible }) => {
  let node = useRef(null)

  let update = useEvent(() => {
    if (node.current == null)
      return

    node.current.textContent = text
    node.current.style.display = isVisible ? 'block' : 'none'
  })

  useEffect(() => {
    update()
  }, [text, isVisible, update])

  return useEvent((doc) => {
    node.current = create('div', { class: 'placeholder' })
    doc.body.prepend(node.current)
    update()
  })
}
