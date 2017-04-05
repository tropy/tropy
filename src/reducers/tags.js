'use strict'

const { TAG, PROJECT } = require('../constants')
const { insert, load, remove, update } = require('./util')

module.exports = {
  tags(state = {}, { type, payload, error, meta }) {
    switch (type) {
      case PROJECT.OPEN:
        return {}
      case TAG.LOAD:
        return load(state, payload, meta, error)
      case TAG.CREATE:
        return (!meta.done || error) ?
          state : insert(state, payload)
      case TAG.DELETE:
        return remove(state, payload, meta, error)
      case TAG.UPDATE:
        return update(state, payload)
      default:
        return state
    }
  }
}
