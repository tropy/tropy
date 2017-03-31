'use strict'

const { TAG, PROJECT } = require('../constants')
const { insert, load, update } = require('./util')

module.exports = {
  tags(state = {}, { type, payload, error, meta }) {
    switch (type) {
      case PROJECT.OPEN:
        return {}
      case TAG.LOAD:
        return load(state, payload, meta, error)
      case TAG.INSERT:
        return insert(state, payload)
      case TAG.UPDATE:
        return update(state, payload)
      default:
        return state
    }
  }
}
