'use strict'

const {
  LOAD, SAVE, UPDATE
} = require('../constants/metadata')

module.exports = {
  load(payload, meta) {
    return {
      type: LOAD,
      payload,
      meta: { async: true, ...meta }
    }
  },

  save(payload, meta) {
    return {
      type: SAVE,
      payload,
      meta: { async: true, record: true, ...meta }
    }
  },

  update(payload, meta) {
    return {
      type: UPDATE,
      payload,
      meta
    }
  }
}
