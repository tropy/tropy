import { useKeyDown } from './use-keymap.js'
import { CursorKeyMap, getKeyState } from '../keymap.js'

export function useCursorKeys (cursor, {
  onKeyDown,
  onMove,
  scrollKeys = 'scroll'
} = {}) {
  let handleCursorKeys = useKeyDown(
    new CursorKeyMap(cursor, { scrollKeys }),
    onMove && ((event, cmd) => {
      let target = cursor.seek(cmd)

      // No target means the key/command was not handled
      if (target == null)
        return false

      // Target, but no move, means the key/command was handled
      if (target === cursor.current())
        return true

      // Cursor moved, but onMove() can still decline by returning false
      return onMove(target, { cmd, ...getKeyState(event) }) !== false
    }))

  return (event) => {
    onKeyDown?.(event)

    if (!event.defaultPrevented)
      handleCursorKeys(event)
  }
}
