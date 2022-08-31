import { useEventHandler } from './use-event-handler.js'
import { match } from '../keymap.js'
import { emit, isInput } from '../dom.js'

export function useGlobalKeys(keymap) {
  useEventHandler(document, 'keydown', (event) => {
    if (isInput(event.target || event.srcElement))
      return

    let name = match(keymap, event)

    if (name == null)
      return

    event.stopPropagation()
    event.preventDefault()

    emit(document, `global:${name}`)

  }, false)
}
