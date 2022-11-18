import { useSelector } from 'react-redux'
import { useEvent } from './use-event.js'
import { match } from '../keymap.js'

export function useKeyMap(name, handlers) {
  let keymap = useSelector(state => state.keymap[name])

  return useEvent((event) => {
    let cmd = match(keymap, event)

    if (!(cmd in handlers))
      return

    event.preventDefault()
    event.stopPropagation()

    event.nativeEvent?.stopImmediatePropagation()

    handlers[cmd](event)
  })
}
