'use strict'

const { FLASH } = require('../constants')

module.exports = {
  show(payload, meta = {}) {
    return {
      type: FLASH.SHOW,
      payload,
      meta
    }
  },

  hide(payload, meta = {}) {
    return {
      type: FLASH.HIDE,
      payload,
      meta
    }
  }
}
