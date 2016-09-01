'use strict'

const { UPDATE, RESTORE } = require('../constants/nav')

const init = {}

module.exports = {
  nav(state = init, { type, payload }) {
    switch (type) {

      case RESTORE:
        return { ...payload }

      case UPDATE:
        return { ...state, ...payload }

      default:
        return state
    }
  }
}
