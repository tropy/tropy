'use strict'

const {
  CREATE, DELETE, INSERT, REMOVE, RESTORE
} = require('../constants/item')


module.exports = {
  create(payload, meta) {
    return {
      type: CREATE,
      payload,
      meta: {
        async: true,
        record: true,
        ...meta
      }
    }
  },

  delete(payload, meta) {
    return { type: DELETE, payload, meta }
  },

  insert(payload, meta) {
    return { type: INSERT, payload, meta }
  },

  remove(payload, meta) {
    return {
      type: REMOVE,
      payload,
      meta: { ...meta }
    }
  },

  restore(payload, meta) {
    return {
      type: RESTORE,
      payload,
      meta: { ...meta }
    }
  }
}
