'use strict'

const { SIDEBAR } = require('../constants')
const { merge } = require('../common/util')

const init = {
  expand: {}
}

module.exports = {
  sidebar(state = init, { type, payload }) {
    switch (type) {
      case SIDEBAR.RESTORE:
        return merge(init, payload)
      case SIDEBAR.UPDATE:
        return merge(state, payload)
      default:
        return state
    }
  }
}
