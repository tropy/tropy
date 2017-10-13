'use strict'

const { IMPORTS, ITEM } = require('../constants')

module.exports = {
  imports(state = [], { type, payload, error, meta }) {
    switch (type) {
      case IMPORTS.RESTORE:
        return (payload != null) ? [...payload] : []
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
