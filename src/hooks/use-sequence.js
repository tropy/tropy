import { getSelectionMode } from '../keymap.js'
import { Selection } from '../common/selection.js'
import { useCursor } from './use-cursor.js'
import { useCursorKeys } from './use-cursor-keys.js'
import { useKeyMap } from './use-keymap.js'
import { useSequenceClicks } from './use-sequence-clicks.js'

export function useSequence (seq, {
  commands,
  isDisabled,
  keymap,
  onContextMenu,
  onOpen,
  onSelect,
  onSelectedClick,
  scrollKeys,
  selection: s
} = {}) {
  let selection = Selection.from(s, seq)

  let [cursor, onLayoutChange] = useCursor(seq, selection.cursor)
  let context = { cursor, selection }

  let handleSelect = (target, info) => {
    let next

    if (Selection.is(s)) {
      next = selection.select(target?.id ?? target, { mode: info.mode })

      if (next === selection.state)
        return
    } else {
      next = target

      if ((next?.id ?? next) === selection.cursor)
        return
    }

    return onSelect?.(next, { ...info, target })
  }

  let select = (element, keyState, cmd) => {
    let mode = getSelectionMode(keyState)

    // In grids, Shift+arrow keys step (move the anchor).
    if (cmd != null && mode === 'extend' && cursor.options?.layout === 'grid')
      mode = 'step'

    return handleSelect(element, {
      ...keyState,
      cmd,
      mode,
      throttle: keyState.repeat
    })
  }

  let handlers = {}

  for (let cmd in commands) {
    let command = commands[cmd]

    if (typeof command === 'function')
      handlers[cmd] = (event) => command(context, event)
  }

  let onKeyDown = useCursorKeys(cursor, {
    scrollKeys,
    onMove: (element, { cmd, ...keyState }) =>
      select(element, keyState, cmd),
    onKeyDown: useKeyMap(keymap ?? [], handlers)
  })

  let clicks = useSequenceClicks(cursor, {
    isDisabled,
    onContextMenu: onContextMenu &&
      ((event, element) => onContextMenu(event, element, context)),
    onDoubleClick: onOpen &&
      ((element) => onOpen(element, context)),
    onSelect: (element, keyState) => select(element, keyState),
    onSelectedClick,
    selection
  })

  let scrollProps = {
    cursor,
    onLayoutChange,

    onClick () {
      handleSelect(null, { mode: 'clear' })
    },

    onTabFocus () {
      let element = cursor.current() ?? seq[0]

      if (selection.size === 0 && element != null)
        handleSelect(element, { cmd: 'focus', mode: 'replace' })
    }
  }

  return [scrollProps, { ...clicks, onKeyDown }]
}
