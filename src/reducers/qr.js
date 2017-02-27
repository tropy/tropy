'use strict'

const { combineReducers } = require('redux')
const { QR } = require('../constants')

module.exports = {
  qr: combineReducers({
    items(state = [], { type, payload }) {
      switch (type) {
        case QR.ITEMS.UPDATE:
          return [...payload]
        default:
          return state
      }
    }
  })
}
