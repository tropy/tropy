'use strict'

const { isArray } = Array


const selection = {
  select(s, items, mod = 'replace') {
    return module.exports[mod](s, items)
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

  merge(s, items) {
    return [...selection.remove(s, items), ...items]
  },

  isSelected(s, items) {
    return isArray(items) ?
      items.find(it => s.includes(it)) :
      s.includes(items)
  }
}

module.exports = selection
