'use strict'

const { METADATA, SELECTION, PROJECT } = require('../constants')
const { replace, touch } = require('./util')

module.exports = {
  // eslint-disable-next-line complexity
  selections(state = {}, { type, payload, error, meta }) {
    switch (type) {
      case PROJECT.OPEN:
        return {}

      case SELECTION.LOAD:
        return (error || !meta.done) ? state : replace(state, payload)

      case METADATA.SAVE:
      case METADATA.RESTORE:
        return touch(state, payload, meta, error)

      default:
        return state
    }
  }
}
