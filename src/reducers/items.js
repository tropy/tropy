'use strict'

const { omit } = require('../common/util')
const { into, map } = require('transducers.js')

const {
  INSERT, REMOVE, LOAD
} = require('../constants/item')

module.exports = {
  items(state = {}, { type, payload, meta, error }) {
    switch (type) {

      case LOAD:
        return (meta.done && !error) ?
          into({ ...state }, map(item => [item.id, item]), payload) :
          {}

      case INSERT:
        return {
          ...state,
          [payload.id]: payload
        }

      case REMOVE:
        return omit(state, [payload])

      default:
        return state
    }
  }
}
