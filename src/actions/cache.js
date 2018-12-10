'use strict'

const { CACHE } = require('../constants')

module.exports = {
  prune(payload, meta = {}) {
    return {
      type: CACHE.PRUNE,
      payload,
      meta: { cmd: 'project', ...meta }
    }
  },

  purge(payload, meta = {}) {
    return {
      type: CACHE.PURGE,
      payload,
      meta: { cmd: 'project', ...meta }
    }
  }
}
