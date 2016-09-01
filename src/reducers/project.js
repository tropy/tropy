'use strict'

const { UPDATE, OPENED } = require('../constants/project')

const init = { name: '' }

module.exports = {
  project(state = init, { type, payload }) {
    switch (type) {

      case OPENED:
        return { ...payload }

      case UPDATE:
        return { ...state, ...payload }

      default:
        return state
    }
  }
}
