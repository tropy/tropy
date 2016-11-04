'use strict'

const {
  CREATE, DELETE, INSERT, REMOVE, RESTORE, SAVE, UPDATE
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
    return {
      type: DELETE,
      payload,
      meta: { async: true, record: true, ...meta }
    }
  },

  insert(payload, meta) {
    return {
      type: INSERT,
      payload,
      meta: { search: true, ...meta }
    }
  },

  remove(payload, meta) {
    return {
      type: REMOVE,
      payload,
      meta: { search: true, ...meta }
    }
  },

  restore(payload, meta) {
    return {
      type: RESTORE,
      payload,
      meta: { async: true, record: true, ...meta }
    }
  },

  save(payload, meta) {
    return {
      type: SAVE,
      payload,
      meta: { async: true, ...meta }
    }
  },

  update(payload, meta) {
    return {
      type: UPDATE,
      payload,
      meta: meta
    }
  }
}
