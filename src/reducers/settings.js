'use strict'

const { SETTINGS } = require('../constants')

const defaults = {
  theme: ARGS.theme
}

module.exports = {
  settings(state = defaults, { type, payload }) {
    switch (type) {
      case SETTINGS.RESTORE:
        return { ...defaults, ...payload }
      case SETTINGS.UPDATE:
        return { ...state, ...payload }
      default:
        return state
    }
  }
}
