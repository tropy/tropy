'use strict'

const { merge } = require('../common/util')
const { ESPER } = require('../constants')

const init = {
  view: {}
}

module.exports = {
  esper(state = init, { type, payload }) {
    switch (type) {
      case ESPER.RESTORE:
        return merge(init, payload)
      case ESPER.UPDATE:
        return merge(state, payload)
      default:
        return state
    }
  }
}
