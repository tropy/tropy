'use strict'

const { CACHE } = require('../constants')

module.exports = {
  prune(payload, meta = {}) {
    return {
      type: CACHE.PRUNE,
      payload,
      meta: { cmd: 'project', ...meta }
    }
  }
}
