'use strict'

const {
  CREATE, DELETE, INSERT, LOAD, REMOVE, RESTORE, SAVE, SELECT, UPDATE
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
  },

  select(payload, meta = {}) {
    return { type: SELECT, payload, meta }
  }
}
