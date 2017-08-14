'use strict'

const { array, omit, splice } = require('../common/util')
const { into, map } = require('transducers.js')
const { isArray } = Array

const util = {
  load(state, payload, meta, error) {
    if (error) return state
    if (meta.done) return util.replace(state, payload)
    return util.pending(state, payload)
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

  touch(state, payload, meta, error) {
    if (!meta.done || error) return state

    let dirty = false
    let modified = {}

    for (let id of payload) {
      const current = state[id]
      if (current == null) continue

      dirty = true
      modified[id] = { ...current, modified: new Date(meta.was) }
    }

    return dirty ? { ...state, ...modified } : state
  },

  nested: {
    add(name, state = {}, payload, { idx } = {}) {
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
            !payload[name].includes(x.id != null ? x.id : x))
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
      { ...state },
      map(id => ({ [id]: { id, pending: true } })),
      payload
    )
  }
}

module.exports = util
