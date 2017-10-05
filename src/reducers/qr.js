'use strict'

const { QR } = require('../constants')
const init = { index: {}, items: [] }

module.exports = {
  qr(state = init, { type, payload }) {
    switch (type) {
      case QR.UPDATE:
        return { ...state, ...payload }
      default:
        return state
    }
  }
}
