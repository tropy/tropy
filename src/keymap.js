'use strict'

const { darwin } = require('./common/os')

const ALT = /^a(lt)?$/i
const CTRL = /^c(trl|ontrol)?$/i
const META = /^cmd|meta|m$/i
const SHIFT = /^s(hift)$/i
const MOD = /^mod|cmdorctrl$/i

function compile(data) {
  let map = {}

  for (let component in data) {
    map[component] = {}

    for (let action in data[component]) {
      map[component][action] = this.parse(data[component][action])
    }
  }

  return map
}

function parse(shortcut) {
  let parts = shortcut.split(/[+-](?!$)/)
  let key = parts.pop()

  if (key === 'Space') key = ' '

  let alt, ctrl, meta, shift

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
  for (let action in map) {
    let shortcut = map[action]

    if (shortcut.key !== event.key) continue
    if (shortcut.alt !== event.altKey) continue
    if (shortcut.ctrl !== event.ctrlKey) continue
    if (shortcut.meta !== event.metaKey) continue
    if (shortcut.shift !== event.shiftKey) continue

    return action
  }

  return null
}

module.exports = {
  compile, parse, match
}
