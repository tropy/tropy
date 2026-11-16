import { darwin } from './common/os.js'

const CMD_OR_CTRL = darwin ? 'meta' : 'ctrl'

const MODIFIERS = new Map([
  ['alt', 'alt'],
  ['option', 'alt'],
  ['control', 'ctrl'],
  ['ctrl', 'ctrl'],
  ['command', 'meta'],
  ['cmd', 'meta'],
  ['meta', 'meta'],
  ['super', 'meta'],
  ['shift', 'shift'],
  ['commandorcontrol', CMD_OR_CTRL],
  ['cmdorctrl', CMD_OR_CTRL]
])

export class KeyMap {
  constructor (specs = {}) {
    this.specs = {}
    for (let name in specs) {
      this.specs[name] = parse(specs[name])
    }
  }

  *[Symbol.iterator] () {
    for (let name in this.specs) {
      for (let spec of this.specs[name]) {
        yield [name, spec]
      }
    }
  }

  match (event) {
    return match(this, event)
  }
}

export function compile (data) {
  let map = {}
  for (let component in data) {
    map[component] = new KeyMap(data[component])
  }
  return map
}


export function parse (input) {
  return Array.isArray(input) ? input.map(p) : [p(input)]
}

function p (string) {
  let parts = string.split(/[+-](?!$)/)
  let key = parts.pop()

  if (key === 'Space') key = ' '
  key = normalize(key)

  let spec = {
    key,
    alt: false,
    ctrl: false,
    meta: false,
    shift: false
  }

  for (let mod of parts) {
    let name = MODIFIERS.get(mod.toLowerCase())

    if (name == null)
      throw new Error(`unknown modifier "${mod}" in "${string}"`)

    spec[name] = true
  }

  return spec
}

const normalize = (key) =>
  (key.length === 1) ? key.toLowerCase() : key

export function modifiers (event) {
  // win32 reports AltGr as Ctrl+Alt.
  let altGr = !!event.getModifierState?.('AltGraph')

  return {
    alt: !!event.altKey && !altGr,
    ctrl: !!event.ctrlKey && !altGr,
    meta: !!event.metaKey,
    shift: !!event.shiftKey
  }
}

export function match (map, event) {
  if ((event.nativeEvent ?? event).isComposing)
    return null

  let key = normalize(event.key)
  let { alt, ctrl, meta, shift } = modifiers(event)

  for (let [name, spec] of map) {
    if (spec.key !== key) continue
    if (spec.alt !== alt) continue
    if (spec.ctrl !== ctrl) continue
    if (spec.meta !== meta) continue
    if (spec.shift !== shift) continue

    return name
  }

  return null
}

export function hasModifiers (event) {
  let { alt, ctrl, meta, shift } = modifiers(event)
  return alt || ctrl || meta || shift
}

export function getKeyState (event) {
  let { alt, ctrl, meta, shift } = modifiers(event)

  return {
    altKey: alt,
    ctrlKey: ctrl,
    metaKey: meta,
    shiftKey: shift,
    repeat: event.repeat
  }
}

export function cmdOrCtrlKey (event) {
  return modifiers(event)[CMD_OR_CTRL]
}

export function getSelectionMode (keyState) {
  if (modifiers(keyState).shift)
    return cmdOrCtrlKey(keyState) ? 'flip' : 'extend'
  else
    return cmdOrCtrlKey(keyState) ? 'toggle' : 'replace'
}

export class CursorKeyMap {
  constructor (cursor, { scrollKeys = 'scroll' } = {}) {
    this.cursor = cursor
    this.scrollKeys = scrollKeys
  }

  get layout () {
    return this.cursor.options?.layout ?? 'list'
  }

  match ({ altKey, key }) {
    switch (key) {
      case 'ArrowUp':
        return altKey ? 'first' : 'up'
      case 'ArrowDown':
        return altKey ? 'last' : 'down'
      case 'ArrowLeft':
        if (this.layout !== 'grid') return null
        return altKey ? 'start' : 'prev'
      case 'ArrowRight':
        if (this.layout !== 'grid') return null
        return altKey ? 'end' : 'next'
      case 'Home':
        return (this.scrollKeys === 'select') ? 'first' : null
      case 'End':
        return (this.scrollKeys === 'select') ? 'last' : null
      case 'PageUp':
        return (this.scrollKeys === 'select') ? 'pageUp' : null
      case 'PageDown':
        return (this.scrollKeys === 'select') ? 'pageDown' : null
      default:
        return null
    }
  }
}
