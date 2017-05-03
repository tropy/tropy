'use strict'

const { PREFS } = require('../constants')
const { update } = require('./util')
const init = { pane: 'template' }

module.exports = {
  prefs(state = init, { type, payload }) {
    switch (type) {
      case PREFS.UPDATE:
        return update(state, payload)
      default:
        return state
    }
  }
}
