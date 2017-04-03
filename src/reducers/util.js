'use strict'

const { array, omit, splice } = require('../common/util')
const { into, map } = require('transducers.js')
const { isArray } = Array

const util = {
  load(state, payload, meta, error) {
    return (meta.done && !error) ?
      util.replace(state, payload) :
      util.pending(state, payload)
  },

  replace(state, payload) {
    return { ...state, ...payload }
  },

  insert(state, payload) {
    return { ...state, [payload.id]: payload }
  },

  remove(state, payload) {
    return omit(state, payload)
  },

  merge(state, payload) {
    return into({ ...state }, map(([id, data]) => ({
      [id]: { ...state[id], ...data }
    })), payload)
  },

  update(state, payload, meta = {}) {
    return {
      ...state,
      [payload.id]: meta.replace ?
        payload : { ...state[payload.id], ...payload }
    }
  },

  nested: {
    add(name, state = {}, payload, { idx }) {
      return into({ ...state }, map(id => ({
        [id]: {
          ...state[id],
          [name]: splice(state[id][name], idx, 0, ...payload[name])
        }
      })), array(payload.id))
    },

    remove(name, state = {}, payload) {
      return into({ ...state }, map(id => ({
        [id]: {
          ...state[id],
          [name]: state[id][name].filter(x =>
            !payload[name].includes(x))
        }
      })), array(payload.id))
    }
  },

  bulk: {
    update(state, payload, meta = {}) {
      if (!isArray(payload)) return util.merge(state, payload)

      const [ids, data] = payload

      return into({ ...state }, map(id => ({
        [id]: meta.replace ? data : { ...state[id], ...data }
      })), ids)
    }
  },

  pending(state, payload) {
    if (payload == null || payload.length === 0) return state

    return into(
      { ...state }, map(id => ({ [id]: { id, pending: true } })), payload
    )
  }
}

module.exports = util
