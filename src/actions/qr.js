'use strict'

const { QR } = require('../constants')

module.exports = {
  update(payload = {}, meta) {
    return {
      type: QR.UPDATE,
      payload,
      meta
    }
  }
}
