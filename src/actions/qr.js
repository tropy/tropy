'use strict'

const { QR } = require('../constants')

module.exports = {
  items: {
    update(payload, meta) {
      return {
        type: QR.ITEMS.UPDATE,
        payload,
        meta
      }
    }
  }
}
