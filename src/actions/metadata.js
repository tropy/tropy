'use strict'

const { METADATA } = require('../constants')

module.exports = {
  insert(payload, meta = {}) {
    return {
      type: METADATA.INSERT,
      payload,
      meta
    }
  },

  load(payload, meta) {
    return {
      type: METADATA.LOAD,
      payload,
      meta: { async: true, ...meta }
    }
  },

  save(payload, meta) {
    return {
      type: METADATA.SAVE,
      payload,
      meta: { async: true, record: true, ...meta }
    }
  },

  update(payload, meta = {}) {
    return {
      type: METADATA.UPDATE,
      payload,
      meta
    }
  }
}
