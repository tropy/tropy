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

// Electron accelerator key names
const KEYS = new Map([
  ['down', 'ArrowDown'],
  ['esc', 'Escape'],
  ['left', 'ArrowLeft'],
  ['plus', '+'],
  ['return', 'Enter'],
  ['right', 'ArrowRight'],
  ['space', ' '],
  ['up', 'ArrowUp']
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

  key = normalize(KEYS.get(key.toLowerCase()) ?? key)

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

  // Whether these characters need Shift depends on the layout,
  // so ignore Shift (null) unless the spec includes it.
  if (!spec.shift && SYMBOL.test(key))
    spec.shift = null

  return spec
}

const normalize = (key) =>
  (key.length === 1) ? key.toLowerCase() : key

const ASCII = /^[\x20-\x7e]$/
const SYMBOL = /^[^a-z ]$/
const KEY_CODE = /^(?:Key|Digit)([A-Z0-9])$/

const PUNCTUATION = new Map([
  ['Backquote', '`'],
  ['Backslash', '\\'],
  ['BracketLeft', '['],
  ['BracketRight', ']'],
  ['Comma', ','],
  ['Equal', '='],
  ['Minus', '-'],
  ['Period', '.'],
  ['Quote', "'"],
  ['Semicolon', ';'],
  ['Slash', '/']
])

// For non-Latin layouts (e.g. Cyrillic) fall back
// to US layout character of the physical key.
function fromCode (code) {
  let m = KEY_CODE.exec(code)
  return m ? m[1].toLowerCase() : PUNCTUATION.get(code)
}

function getKey ({ key, code }) {
  key = normalize(key)

  if (key.length === 1 && !ASCII.test(key))
    return fromCode(code) ?? key

  return key
}

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

  let key = getKey(event)
  let { alt, ctrl, meta, shift } = modifiers(event)

  for (let [name, spec] of map) {
    if (spec.key !== key) continue
    if (spec.alt !== alt) continue
    if (spec.ctrl !== ctrl) continue
    if (spec.meta !== meta) continue
    if (spec.shift != null && spec.shift !== shift) continue

    return name
  }

  return null
}

export const anyModifierKey = (event) =>
  Object.values(modifiers(event)).includes(true)

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

export function altKey (event) {
  return modifiers(event).alt
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

  match (event) {
    let alt = altKey(event)

    switch (event.key) {
      case 'ArrowUp':
        return alt ? 'first' : 'up'
      case 'ArrowDown':
        return alt ? 'last' : 'down'
      case 'ArrowLeft':
        if (this.layout !== 'grid') return null
        return alt ? 'start' : 'prev'
      case 'ArrowRight':
        if (this.layout !== 'grid') return null
        return alt ? 'end' : 'next'
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
