'use strict'

const { UPDATE, RESTORE } = require('../constants/nav')
const LIST = require('../constants/list')

const init = { items: [] }

module.exports = {
  nav(state = init, { type, payload }) {
    switch (type) {

      case RESTORE:
        return { ...init, ...payload }

      case UPDATE:
        return { ...state, ...payload }

      case LIST.REMOVE:
        return state.list === payload ?
          { ...state, list: undefined } :
          state

      default:
        return state
    }
  }
}
