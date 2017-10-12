'use strict'

const { ITEM } = require('../constants')

module.exports = {
  imports(state = [], { type, payload, error, meta }) {
    switch (type) {
      case ITEM.IMPORT:
        return (!meta.done || error || !payload.length) ? state : [{
          time: Date.now(),
          items: payload
        }]
      default:
        return state
    }
  }
}
