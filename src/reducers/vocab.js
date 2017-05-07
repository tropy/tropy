'use strict'

const { VOCAB } = require('../constants')

module.exports = {
  vocab(state = {}, { payload, type }) {
    switch (type) {
      case VOCAB.UPDATE:
        return { ...state, ...payload }
      default:
        return state
    }
  }
}
