'use strict'

const {
  INSERT, LOAD, REMOVE, SAVE, UPDATE
} = require('../constants/list')

const { omit } = require('../common/util')
const { into, map } = require('transducers.js')

module.exports = {
  lists(state = {}, { type, payload, error, meta }) {
    switch (type) {
      case LOAD:
        return (meta.done && !error) ?
          into({ ...state }, map(list => [list.id, list]), payload) :
          {}

      case INSERT: {
        const parent = state[payload.parent]
        const idx = meta.position - 1

        return {
          ...state,

          [parent.id]: {
            ...parent,
            children: [
              ...parent.children.slice(0, idx),
              payload.id,
              ...parent.children.slice(idx)
            ]
          },

          [payload.id]: payload
        }
      }

      case REMOVE: {
        const original = state[payload]
        const parent = state[original.parent]

        return {
          ...omit(state, [original.id]),

          [parent.id]: {
            ...parent,
            children: parent.children.filter(id => id !== original.id)
          }
        }
      }

      case UPDATE:
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
