'use strict'

const { METADATA, SELECTION, PROJECT } = require('../constants')
const { load, touch } = require('./util')

module.exports = {
  // eslint-disable-next-line complexity
  selections(state = {}, { type, payload, error, meta }) {
    switch (type) {
      case PROJECT.OPEN:
        return {}

      case SELECTION.LOAD:
        return load(state, payload, meta, error)

      case METADATA.SAVE:
      case METADATA.RESTORE:
        return touch(state, payload, meta, error)

      default:
        return state
    }
  }
}
