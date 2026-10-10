import { useSelector } from 'react-redux'

export function useKeyDown (keymap, handlers) {
  return (event) => {
    let cmd = keymap?.match(event)

    let handler = (typeof handlers === 'function') ?
      handlers :
      handlers?.[cmd]

    if (cmd == null || typeof handler !== 'function')
      return

    // Handlers return false to leave the event unhandled.
    if (handler(event, cmd) === false)
      return

    event.preventDefault()
    event.stopPropagation()

    event.nativeEvent?.stopImmediatePropagation()
  }
}

export function useKeyMap (name, handlers) {
  return useKeyDown(useSelector(state => state.keymap[name]), handlers)
}
