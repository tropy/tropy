'use strict'

const {
  CREATE, DELETE, INSERT, LOAD, REMOVE, RESTORE
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
    return {
      type: INSERT,
      payload,
      meta: { ...meta }
    }
  },

  load(payload, meta) {
    return {
      type: LOAD,
      payload,
      meta: { async: true, ...meta }
    }
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
