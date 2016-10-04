'use strict'

const {
  INSERT, LOAD, REMOVE, UPDATE
} = require('../constants/list')

const {
  OPENED
} = require('../constants/project')

const { omit } = require('../common/util')
const { into, map } = require('transducers.js')

module.exports = {
  lists(state = {}, { type, payload, error, meta }) {
    switch (type) {
      case LOAD:
        return (meta.done && !error) ?
          into({ ...state }, map(list => [list.id, list]), payload) : state

      case INSERT:
        return into({ ...state }, map(list => [list.id, list]), payload)

      case REMOVE:
        return omit(state, [payload])

      case UPDATE:
        return {
          ...state,
          [payload.id]: {
            ...state[payload.id],
            ...payload
          }
        }

      case OPENED:
        return {}

      default:
        return state
    }
  }
}
