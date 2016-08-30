'use strict'

const { UPDATE } = require('../constants/nav')

module.exports = {
  nav(state = {}, action) {
    switch (action.type) {

      case UPDATE:
        return { ...state, ...action.payload }

      default:
        return state
    }
  }
}
