'use strict'

const { merge } = require('../common/util')
const { NOTEPAD } = require('../constants')
const init = {}

module.exports = {
  notepad(state = init, { type, payload }) {
    switch (type) {
      case NOTEPAD.RESTORE:
        return merge(init, payload)
      case NOTEPAD.UPDATE:
        return merge(state, payload)
      default:
        return state
    }
  }
}
