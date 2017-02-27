'use strict'

const { UI } = require('../constants')
const { merge } = require('../common/util')

const init = {
  sidebar: {}
}

module.exports = {
  ui(state = init, { type, payload }) {
    switch (type) {
      case UI.RESTORE:
        return merge(payload, init)
      default:
        return state
    }
  }
}
