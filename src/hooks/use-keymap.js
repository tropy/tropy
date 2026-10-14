import { useSelector } from 'react-redux'
import { array } from '../common/util.js'

function matchFirst (event, keymaps) {
  for (let keymap of keymaps) {
    let cmd = keymap?.match(event)
    if (cmd != null) return cmd
  }
}

export function useKeyDown (keymap, handlers) {
  return (event) => {
    let cmd = Array.isArray(keymap)
      ? matchFirst(event, keymap)
      : keymap?.match(event)

    let handler = (typeof handlers === 'function')
      ? handlers
      : handlers?.[cmd]

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

export function useKeyMap (names, handlers) {
  let keymap = useSelector(state => state.keymap)
  return useKeyDown(array(names).map(name => keymap[name]), handlers)
}
