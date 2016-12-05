'use strict'

module.exports = {
  date(value) {
    return { value, type: 'date' }
  },

  datetime(value) {
    return { value, type: 'datetime' }
  },

  text(value) {
    return { value, type: 'text' }
  }
}
