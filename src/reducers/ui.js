'use strict'

const { UI } = require('../constants')
const { merge } = require('../common/util')

const init = {
  esper: { height: 50 },
  panel: { tab: 'metadata', width: 320, zoom: 0 },
  sidebar: { width: 250 },
  zoom: 0
}

module.exports = {
  ui(state = init, { type, payload }) {
    switch (type) {
      case UI.RESTORE:
        return merge(init, payload)
      case UI.UPDATE:
        return merge(state, payload)
      default:
        return state
    }
  }
}
