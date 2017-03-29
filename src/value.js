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
  }
}
