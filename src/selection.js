'use strict'

module.exports = {

  select(selection, mod = 'replace', ...ids) {
    return module.exports[mod](selection, ...ids)
  },

  clear() {
    return []
  },

  replace(selection, ...ids) {
    return [...ids]
  },

  remove(selection, ...ids) {
    return selection.filter(id => !ids.includes(id))
  },

  append(selection, ...ids) {
    return [...selection, ...ids]
  },

  isSelected(selection, ...ids) {
    return ids.find(id => selection.includes(id))
  }
}
