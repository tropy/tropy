'use strict'

const { omit, splice } = require('../common/util')
const { into, map } = require('transducers.js')

const util = {

  load(state, payload, meta, error) {
    return (meta.done && !error) ?
      { ...state, ...payload } : util.pending(state, payload)
  },

  insert(state, payload) {
    return { ...state, [payload.id]: payload }
  },

  remove(state, payload) {
    return omit(state, payload)
  },

  update(state, payload) {
    return {
      ...state, [payload.id]: { ...state[payload.id], ...payload }
    }
  },

  nested: {
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

    remove(name, state = {}, payload) {
      const { id, [name]: removed } = payload

      return {
        ...state,
        [id]: {
          ...state[id],
          [name]: state[id][name].filter(x => !removed.includes(x))
        }
      }
    }
  },

  bulk: {
    update(state, [ids, data]) {
      return into(
        { ...state }, map(id => ({ [id]: { ...state[id], ...data } })), ids
      )
    }
  },

  pending(state, payload) {
    return into(
      { ...state },
      map(id => ({ [id]: { id, pending: true } })),
      payload
    )
  }
}

module.exports = util
