'use strict'

const { ITEM } = require('../constants')
const { empty } = require('../common/util')
const { keys } = Object

module.exports = {
  imports(state = [], { type, payload, error, meta }) {
    switch (type) {
      case ITEM.IMPORT:
        return (!meta.done || error || empty(payload)) ? state : [{
          time: Date.now(),
          items: keys(payload).map(Number)
        }]
      default:
        return state
    }
  }
}
