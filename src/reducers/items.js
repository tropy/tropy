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
        return nested.add('tags', state, payload)

      case ITEM.TAG.REMOVE:
        return nested.remove('tags', state, payload)

      case ITEM.PHOTO.ADD:
        return nested.add('photos', state, payload)

      case ITEM.PHOTO.REMOVE:
        return nested.remove('photos', state, payload)

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
        [name]: [...state[id][name], ...added]
      }
    }
  },

  remove(name, state = [], payload) {
    const { id, [name]: removed } = payload

    return {
      ...state,
      [id]: {
        ...state[id],
        [name]: state[id][name].filter(x => !removed.includes(x))
      }
    }
  }
}
