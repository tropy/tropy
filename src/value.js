'use strict'

const { TYPE } = require('./constants')

module.exports = {
  date(value) {
    return { text: value, type: TYPE.DATE }
  },

  text(value) {
    return { text: value, type: TYPE.TEXT }
  },

  value(value, type) {
    return { text: value, type: type || TYPE.TEXT }
  },

  equal(a, b) {
    if (a === b) return true
    if (a == null || b == null) return false

    return a.type === b.type && a.text === b.text
  }
}
