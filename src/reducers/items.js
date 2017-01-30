'use strict'

const { omit, splice } = require('../common/util')
const { ITEM, PROJECT } = require('../constants')
const { into, map } = require('transducers.js')

const init = {}

module.exports = {
  //eslint-disable-next-line complexity
  items(state = init, { type, payload, meta, error }) {
    switch (type) {
      case PROJECT.OPEN:
        return { ...init }

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

      case ITEM.BULK.UPDATE: {
        const [ids, data] = payload

        return into(
          { ...state },
          map(id => ({ [id]: { ...state[id], ...data } })),
          ids
        )
      }

      case ITEM.TAG.ADD:
        return nested.add('tags', state, payload, meta)

      case ITEM.TAG.REMOVE:
        return nested.remove('tags', state, payload, meta)

      case ITEM.PHOTO.ADD:
        return nested.add('photos', state, payload, meta)

      case ITEM.PHOTO.REMOVE:
        return nested.remove('photos', state, payload, meta)

      default:
        return state
    }
  }
}

const nested = {
  add(name, state = {}, payload, { idx }) {
    const { id, [name]: added } = payload

    if (idx == null || idx < 0) idx = state[id][name].length

    return {
      ...state,
      [id]: {
        ...state[id],
        [name]: splice(state[id][name], idx, 0, ...added)
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
