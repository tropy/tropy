'use strict'

const { omit } = require('../common/util')
const { ITEM } = require('../constants')


module.exports = {
  items(state = {}, { type, payload, meta, error }) {
    switch (type) {
      case ITEM.LOAD:
        return (meta.done && !error) ?
          { ...state, ...payload } : state

      case ITEM.INSERT:
        return {
          ...state,
          [payload.id]: payload
        }

      case ITEM.REMOVE:
        return omit(state, payload)

      case ITEM.UPDATE:
        return {
          ...state,
          [payload.id]: {
            ...state[payload.id],
            ...payload
          }
        }

      case ITEM.TAG.ADD:
        return nested.add('tag', state, payload)

      case ITEM.TAG.REMOVE:
        return nested.remove('tag', state, payload)

      default:
        return state
    }
  }
}

const nested = {
  add(name, state = {}, payload) {
    const { id, [name]: added } = payload

    return {
      ...state,
      [id]: {
        ...state[id],
        [`${name}s`]: [...state[id][`${name}s`], added]
      }
    }
  },

  remove(name, state = [], payload) {
    const { id, [name]: removed } = payload

    return {
      ...state,
      [id]: {
        ...state[id],
        [`${name}s`]: state[id][`${name}s`].filter(x => x !== removed)
      }
    }
  }
}
