
'use strict'

const { FLASH } = require('../constants')

module.exports = {
  flash(state = {}, { type, payload }) {
    switch (type) {
      case FLASH.READY:
        return { ...payload }
      default:
        return state
    }
  }
}
