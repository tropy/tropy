'use strict'

const { CLASSES } = require('../constants')

module.exports = {
  classes(state = {}, { type, payload }) {
    switch (type) {
      case CLASSES.RESTORE:
        return {}
      case CLASSES.UPDATE:
        return { ...state, ...payload }
      default:
        return state
    }
  }
}
