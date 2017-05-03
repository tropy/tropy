'use strict'

const { PREFS } = require('../constants')
const init = { pane: 'template' }

module.exports = {
  prefs(state = init, { type, payload }) {
    switch (type) {
      case PREFS.UPDATE:
        return { ...state, ...payload }
      default:
        return state
    }
  }
}
