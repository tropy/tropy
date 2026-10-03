import { useSelector } from 'react-redux'
import { useEvent } from './use-event.js'

export function useKeyDown (keymap, handlers) {
  return useEvent((event) => {
    let cmd = keymap?.match(event)

    if (!(cmd in handlers))
      return

    event.preventDefault()
    event.stopPropagation()

    event.nativeEvent?.stopImmediatePropagation()

    handlers[cmd](event)
  })
}

export function useKeyMap (name, handlers) {
  return useKeyDown(useSelector(state => state.keymap[name]), handlers)
}
