'use strict'

const { NOTE, PROJECT } = require('../constants')
const { insert } = require('./util')

const init = {}

module.exports = {
  // eslint-disable-next-line complexity
  note(state = init, { type, payload, error, meta }) {
    switch (type) {
      case PROJECT.OPEN:
        return { ...init }

      case NOTE.CREATE:
      case NOTE.LOAD:
        return (meta.done && !error) ? { ...state, ...payload } : state

      case NOTE.INSERT:
        return insert(state, payload, meta)

      case NOTE.UPDATE:
        return {
          ...state,
          [payload.id]: {
            ...state[payload.id],
            ...payload
          }
        }

      default:
        return state
    }
  }
}
