'use strict'

const { LIST, UI } = require('../constants')

module.exports = {

  new(payload, meta) {
    return {
      type: UI.EDIT.START,
      payload: {
        list: { name: '', parent: LIST.ROOT, ...payload, }
      },
      meta
    }
  },

  insert(payload, meta = {}) {
    return { type: LIST.INSERT, payload, meta }
  },

  remove(payload, meta) {
    return { type: LIST.REMOVE, payload, meta }
  },

  save(payload, meta) {
    return {
      type: ('id' in payload) ? LIST.SAVE : LIST.CREATE,
      payload,
      meta: { async: true, record: true, ...meta }
    }
  },

  delete(payload, meta) {
    return {
      type: LIST.DELETE,
      payload,
      meta: {
        async: true,
        record: true,
        ...meta
      }
    }
  },

  prune(payload, meta) {
    return { type: LIST.PRUNE, payload, meta: { async: true, ...meta } }
  },

  restore(payload, meta) {
    return { type: LIST.RESTORE, payload, meta: { async: true, ...meta } }
  },

  load(payload, meta) {
    return { type: LIST.LOAD, payload, meta: { async: true, ...meta } }
  },

  update(payload, meta) {
    return { type: LIST.UPDATE, payload, meta }
  },

  items: {
    add(payload, meta) {
      return {
        type: LIST.ITEM.ADD,
        payload,
        meta: { async: true, record: true, load: true, ...meta }
      }
    },

    remove(payload, meta) {
      return {
        type: LIST.ITEM.REMOVE,
        payload,
        meta: { async: true, record: true, load: true, ...meta }
      }
    }
  }
}
