import { darwin } from './common/os.js'

const ALT = /^a(lt)?$/i
const CTRL = /^c(trl|ontrol)?$/i
const META = /^cmd|meta|m$/i
const SHIFT = /^s(hift)$/i
const MOD = /^mod|cmdorctrl$/i

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

  let alt = false, ctrl = false, meta = false, shift = false

  for (let mod of parts) {
    switch (true) {
      case (ALT.test(mod)):
        alt = true
        break
      case (CTRL.test(mod) || (!darwin && MOD.test(mod))):
        ctrl = true
        break
      case (META.test(mod) || (darwin && MOD.test(mod))):
        meta = true
        break
      case (SHIFT.test(mod)):
        shift = true
        break
    }
  }

  return { key, alt, ctrl, meta, shift }
}

export function match (map, event) {
  for (let [name, spec] of map) {
    if (spec.key !== event.key) continue
    if (spec.alt !== event.altKey) continue
    if (spec.ctrl !== event.ctrlKey) continue
    if (spec.meta !== event.metaKey) continue
    if (spec.shift !== event.shiftKey) continue

    return name
  }

  return null
}

export const getKeyState = (event) => ({
  altKey: event.altKey,
  ctrlKey: event.ctrlKey,
  metaKey: event.metaKey,
  shiftKey: event.shiftKey,
  repeat: event.repeat
})

export function isMeta (event) {
  return (!darwin && event.ctrlKey) || (darwin && event.metaKey)
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
