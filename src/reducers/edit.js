'use strict'

const { EDIT } = require('../constants')

module.exports = {
  edit(state = {}, { type, payload }) {
    switch (type) {
      case EDIT.START:
        return { ...payload }
      case EDIT.CANCEL:
        return {}
      default:
        return state
    }
  }
}
