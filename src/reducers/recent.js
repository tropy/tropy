'use strict'

const { PROJECT, RECENT } = require('../constants')
const { merge } = require('../common/util')
const INIT = {}

module.exports = {
  recent(state = INIT, { type, payload }) {
    switch (type) {
      case RECENT.RESTORE:
        return merge(INIT, payload)
      case PROJECT.OPENED: {
        let { id, file } = payload
        return merge(state, {
          [id]: { id, file, opened: Date.now() }
        })
      }
      default:
        return state
    }
  }
}
