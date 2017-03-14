'use strict'

const { join } = require('path')
const { Resource } = require('./common/res')
const { darwin } = require('./common/os')

const ALT = /^a(lt)?$/i
const CTRL = /^c(trl|ontrol)?$/i
const META = /^cmd|meta|m$/i
const SHIFT = /^s(hift)$/i
const MOD = /^mod|cmdorctrl$/i


class KeyMap extends Resource {
  static get base() {
    return join(super.base, 'keymaps')
  }

  static open(locale, name, ...args) {
    return super.open(`${name}.${locale}`, locale, ...args)
  }

  constructor(data = {}, locale = 'en') {
    super()
    this.map = this.compile(data[process.platform])
    this.locale = locale
  }

  compile(data) {
    let map = {}

    for (let component in data) {
      map[component] = {}

      for (let action in data[component]) {
        map[component][action] = this.parse(data[component][action])
      }
    }

    return map
  }

  parse(shortcut) {
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

  match(event, component = 'global') {
    let map = this.map[component]

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
}

module.exports = {
  KeyMap
}
