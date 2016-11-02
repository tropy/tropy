'use strict'

const { LOAD, UPDATE } = require('../constants/metadata')

module.exports = {
  metadata(state = {}, { type, payload, meta, error }) {
    switch (type) {
      case LOAD:
        return (meta.done && !error) ? { ...state, ...payload } : state

      case UPDATE: {
        const [id, data] = payload

        return {
          ...state,
          [id]: {
            ...state[id],
            ...data
          }
        }
      }

      default:
        return state
    }
  }
}
