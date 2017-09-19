'use strict'

const { PROJECT, ITEM } = require('../constants')
const INIT = { name: '', items: 0 }

function dec(state, by = 1) {
  return { ...state, items: Math.max(0, state.items - by) }
}

function inc(state, by = 1) {
  return { ...state, items: state.items + by }
}

module.exports = {
  // eslint-disable-next-line complexity
  project(state = INIT, { type, payload, meta, error }) {
    switch (type) {
      case PROJECT.OPENED:
        return { ...payload }
      case PROJECT.UPDATE:
        return { ...state, ...payload }
      case PROJECT.CLOSED:
        return INIT

      case ITEM.INSERT:
        return inc(state)
      case ITEM.RESTORE:
        return (!error && meta.done) ? inc(state, payload.length) : state
      case ITEM.DELETE:
        return (!error && meta.done) ? dec(state, payload.length) : state

      case ITEM.MERGE:
      case ITEM.IMPLODE:
        return (!error && meta.done) ? dec(state, meta.dec) : state
      case ITEM.EXPLODE:
      case ITEM.SPLIT:
        return (!error && meta.done) ? inc(state, meta.inc) : state

      default:
        return state
    }
  }
}
