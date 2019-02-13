'use strict'

const { darwin } = require('./common/os')
const { isArray } = Array

const ALT = /^a(lt)?$/i
const CTRL = /^c(trl|ontrol)?$/i
const META = /^cmd|meta|m$/i
const SHIFT = /^s(hift)$/i
const MOD = /^mod|cmdorctrl$/i

class KeyMap {
  constructor(specs = {}) {
    this.specs = {}
    for (let name in specs) {
      this.specs[name] = parse(specs[name])
    }
  }

  *[Symbol.iterator]() {
    for (let name in this.specs) {
      for (let spec of this.specs[name]) {
        yield [name, spec]
      }
    }
  }

  match(event) {
    return match(this, event)
  }
}

function compile(data) {
  let map = {}
  for (let component in data) {
    map[component] = new KeyMap(data[component])
  }
  return map
}


function parse(input) {
  return isArray(input) ?  input.map(p) : [p(input)]
}

function p(string) {
  let parts = string.split(/[+-](?!$)/)
  let key = parts.pop()

  if (key === 'Space') key = ' '

  let alt = false, ctrl = false, meta = false, shift = false

  for (let mod of parts) {
    switch (true) {
      case (ALT.test(mod)):
        alt = true
        break
      case (CTRL.test(mod) || !darwin && MOD.test(mod)):
        ctrl = true
        break
      case (META.test(mod) || darwin && MOD.test(mod)):
        meta = true
        break
      case (SHIFT.test(mod)):
        shift = true
        break
    }
  }

  return { key, alt, ctrl, meta, shift }
}

function match(map, event) {
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

function isMeta(event) {
  return (!darwin && event.ctrlKey) || (darwin && event.metaKey)
}

module.exports = {
  KeyMap,
  compile,
  isMeta,
  parse,
  match
}
