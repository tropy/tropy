'use strict'

const { PREFS } = require('../constants')
const defaults = { pane: 'app' }

module.exports = {
  prefs(state = defaults, { type, payload }) {
    switch (type) {
      case PREFS.RESTORE:
        return { ...defaults, ...payload }
      case PREFS.UPDATE:
        return { ...state, ...payload }
      default:
        return state
    }
  }
}
