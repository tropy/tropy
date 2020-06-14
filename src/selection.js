'use strict'

const { isArray } = Array


const Selection = {
  select(s, items, mod = 'replace') {
    return Selection[mod](s, items)
  },

  clear() {
    return []
  },

  replace(_, items) {
    return [...items]
  },

  remove(s, items) {
    return s.filter(it => !items.includes(it))
  },

  subtract(s, [head, ...items]) {
    return [...s.filter(it => it !== head && !items.includes(it)), head]
  },

  append(s, items) {
    return [...s, ...items]
  },

  merge(s, items) {
    return [...Selection.remove(s, items), ...items]
  },

  isSelected(s, items) {
    return isArray(items) ?
      items.find(it => s.includes(it)) :
      s.includes(items)
  }
}

module.exports = Selection
