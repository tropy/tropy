'use strict'

module.exports = {
  date(value) {
    return { text: value, type: 'date' }
  },

  datetime(value) {
    return { text: value, type: 'datetime' }
  },

  text(value) {
    return { text: value, type: 'text' }
  },

  equal(a, b) {
    if (a === b) return true
    if (a == null || b == null) return false

    return a.type === b.type && a.text === b.text
  }
}
