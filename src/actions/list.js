'use strict'

const {
  CREATE, INSERT, REMOVE, SAVE, DELETE, RESTORE, LOAD, UPDATE, PRUNE, ROOT
} = require('../constants/list')

const { EDIT } = require('../constants/ui')

module.exports = {

  new(payload, meta) {
    return {
      type: EDIT.START,
      payload: {
        list: { name: '', parent: ROOT, ...payload, }
      },
      meta
    }
  },

  insert(payload, meta = {}) {
    return { type: INSERT, payload, meta }
  },

  remove(payload, meta) {
    return { type: REMOVE, payload, meta }
  },

  save(payload, meta) {
    return {
      type: ('id' in payload) ? SAVE : CREATE,
      payload,
      meta: { async: true, record: true, ...meta }
    }
  },

  delete(payload, meta) {
    return {
      type: DELETE,
      payload,
      meta: {
        async: true,
        record: true,
        ...meta
      }
    }
  },

  prune(payload, meta) {
    return { type: PRUNE, payload, meta: { async: true, ...meta } }
  },

  restore(payload, meta) {
    return { type: RESTORE, payload, meta: { async: true, ...meta } }
  },

  load(payload, meta) {
    return { type: LOAD, payload, meta: { async: true, ...meta } }
  },

  update(payload, meta) {
    return { type: UPDATE, payload, meta }
  }
}
