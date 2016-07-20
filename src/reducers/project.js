'use strict'

const { UPDATE } = require('../constants/project')

module.exports = {
  project(state = {}, action) {
    switch (action.type) {

      case UPDATE:
        return { ...state, ...action.payload }

      default:
        return state
    }
  }
}
