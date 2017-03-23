'use strict'

const { LIST, EDIT } = require('../constants')
const { array } = require('../common/util')

module.exports = {

  new(payload, meta) {
    return {
      type: EDIT.START,
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
    return {
      type: LIST.REMOVE,
      payload,
      meta: { search: true, ...meta }
    }
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

  order(payload, meta) {
    return {
      type: LIST.ORDER,
      payload,
      meta: { async: true, record: true, ...meta }
    }
  },

  load(payload, meta) {
    return { type: LIST.LOAD, payload, meta: { async: true, ...meta } }
  },

  update(payload, meta) {
    return { type: LIST.UPDATE, payload, meta }
  },

  items: {
    add({ id, items }, meta) {
      return {
        type: LIST.ITEM.ADD,
        payload: { id, items: array(items) },
        meta: { async: true, record: true, search: true, ...meta }
      }
    },

    remove({ id, items }, meta) {
      return {
        type: LIST.ITEM.REMOVE,
        payload: { id, items: array(items) },
        meta: { async: true, record: true, search: true, ...meta }
      }
    },

    restore({ id, items }, meta) {
      return {
        type: LIST.ITEM.RESTORE,
        payload: { id, items: array(items) },
        meta: { async: true, search: true, ...meta }
      }
    }
  }
}
