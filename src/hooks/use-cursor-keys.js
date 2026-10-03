import { useEvent } from './use-event.js'
import { useKeyDown } from './use-keymap.js'
import { CursorKeyMap, getModifiers } from '../keymap.js'

export function useCursorKeys (cursor, {
  onKeyDown,
  onMove,
  scrollKeys = 'scroll'
} = {}) {
  let move = useEvent((cmd, modifiers) => {
    let target = cursor.seek(cmd)

    if (target != null)
      onMove(target, { cmd, ...modifiers })

    return target
  })

  let keymap = new CursorKeyMap(cursor, { scrollKeys })

  let handleCursorKeys = useKeyDown(
    keymap,
    onMove && ((event, cmd) =>
      move(cmd, getModifiers(event)) != null))

  let handleKeyDown = useEvent((event) => {
    onKeyDown?.(event)

    if (!event.defaultPrevented)
      handleCursorKeys(event)
  })

  return {
    onKeyDown: handleKeyDown,
    move
  }
}
