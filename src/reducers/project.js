'use strict'

const { UPDATE, OPENED } = require('../constants/project')

const init = { name: '' }

module.exports = {
  project(state = init, action) {
    switch (action.type) {

      case OPENED:
        if (!action.error) {
          return { ...action.payload }
        }
        break

      case UPDATE:
        return { ...state, ...action.payload }

      default:
        return state
    }
  }
}
