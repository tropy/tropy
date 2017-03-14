'use strict'

const { KEYMAP } = require('../constants')

module.exports = {
  keymap(state = {}, { type, payload }) {
    switch (type) {

      case KEYMAP.UPDATE:
        return { ...state, ...payload }

      default:
        return state
    }
  }
}

