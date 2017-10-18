'use strict'

const { FLASH } = require('../constants')

module.exports = {
  ready(payload, meta = {}) {
    return {
      type: FLASH.UPDATE,
      payload,
      meta
    }
  }
}
