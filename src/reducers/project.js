'use strict'

const { UPDATE } = require('../constants/project')

const init = {
  name: ''
}
module.exports = {
  project(state = init, action) {
    switch (action.type) {

      case UPDATE:
        return { ...state, ...action.payload }

      default:
        return state
    }
  }
}
