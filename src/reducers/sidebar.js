'use strict'

const { LIST, SIDEBAR } = require('../constants')
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

      case LIST.COLLAPSE:
        return {
          ...state,
          expand: { ...state.expand, [payload]: false }
        }
      case LIST.EXPAND:
        return {
          ...state,
          expand: { ...state.expand, [payload]: true }
        }
      case LIST.INSERT:
        return {
          ...state,
          expand: { ...state.expand, [payload.parent]: true }
        }

      default:
        return state
    }
  }
}
