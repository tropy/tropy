'use strict'

const { TAG, EDIT } = require('../constants')

module.exports = {

  new(payload, meta) {
    return {
      type: EDIT.START,
      payload: {
        tag: { name: '', ...payload, }
      },
      meta
    }
  },

  create(payload, meta) {
    return {
      type: TAG.CREATE,
      payload,
      meta: {
        async: true,
        record: true,
        ...meta
      }
    }
  },

  insert(payload, meta = {}) {
    return {
      type: TAG.INSERT,
      payload,
      meta: { ipc: TAG.CHANGED, ...meta }
    }
  },

  remove(payload, meta) {
    return {
      type: TAG.REMOVE,
      payload,
      meta: { ipc: TAG.CHANGED, ...meta }
    }
  },

  save(payload, meta) {
    return {
      type: TAG.SAVE,
      payload,
      meta: { async: true, record: true, ...meta }
    }
  },

  hide(payload, meta) {
    return {
      type: TAG.HIDE,
      payload,
      meta: {
        async: true,
        record: true,
        ...meta
      }
    }
  },

  prune(payload, meta) {
    return {
      type: TAG.PRUNE,
      payload,
      meta: { async: true, ...meta }
    }
  },

  show(payload, meta) {
    return {
      type: TAG.SHOW,
      payload,
      meta: { async: true, ...meta }
    }
  },

  load(payload, meta) {
    return {
      type: TAG.LOAD,
      payload,
      meta: { async: true, ipc: TAG.CHANGED, ...meta }
    }
  },

  update(payload, meta) {
    return {
      type: TAG.UPDATE,
      payload,
      meta: { ipc: TAG.CHANGED, ...meta }
    }
  },

  select(payload, meta) {
    return {
      type: TAG.SELECT,
      payload,
      meta: { search: true, ...meta }
    }
  }
}
