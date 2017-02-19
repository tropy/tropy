'use strict'

const { ITEM } = require('../constants')
const { array } = require('../common/util')

module.exports = {
  create(payload, meta) {
    return {
      type: ITEM.CREATE,
      payload,
      meta: {
        async: true,
        record: true,
        ...meta
      }
    }
  },

  import(payload = {}, meta) {
    return {
      type: ITEM.IMPORT,
      payload,
      meta: { async: true, record: true, ...meta }
    }
  },

  delete(payload, meta) {
    return {
      type: ITEM.DELETE,
      payload: array(payload),
      meta: { async: true, record: true, ...meta }
    }
  },

  destroy(payload, meta) {
    return {
      type: ITEM.DESTROY,
      payload: array(payload),
      meta: { async: true, prompt: true, ...meta }
    }
  },

  insert(payload, meta) {
    return {
      type: ITEM.INSERT,
      payload,
      meta: { search: true, ...meta }
    }
  },

  load(payload, meta) {
    return {
      type: ITEM.LOAD,
      payload,
      meta: { async: true, ...meta }
    }
  },

  remove(payload, meta) {
    return {
      type: ITEM.REMOVE,
      payload,
      meta: { search: true, ...meta }
    }
  },

  restore(payload, meta) {
    return {
      type: ITEM.RESTORE,
      payload: array(payload),
      meta: { async: true, record: true, ...meta }
    }
  },

  save(payload, meta) {
    return {
      type: ITEM.SAVE,
      payload,
      meta: { async: true, record: true, ...meta }
    }
  },

  update(payload, meta) {
    return {
      type: ITEM.UPDATE,
      payload,
      meta: meta
    }
  },

  select(payload, meta) {
    return {
      type: ITEM.SELECT,
      payload,
      meta: { load: true, ...meta }
    }
  },

  open(payload, meta) {
    return {
      type: ITEM.OPEN,
      payload,
      meta: { load: true, ...meta }
    }
  },

  preview({ id, photos }, meta) {
    return {
      type: ITEM.PREVIEW,
      payload: { id, photos },
      meta: { ipc: true, ...meta }
    }
  },

  bulk: {
    update(payload, meta) {
      return {
        type: ITEM.BULK.UPDATE,
        payload,
        meta: meta
      }
    }
  },

  tags: {
    toggle(payload, meta = {}) {
      return {
        type: ITEM.TAG.TOGGLE,
        payload,
        meta: { async: true, record: true, ...meta }
      }
    },

    clear(payload, meta = {}) {
      return {
        type: ITEM.TAG.CLEAR,
        payload,
        meta: { async: true, record: true, ...meta }
      }
    },

    add(payload, meta) {
      return {
        type: ITEM.TAG.ADD,
        payload,
        meta: { ...meta }
      }
    },

    remove(payload, meta) {
      return {
        type: ITEM.TAG.REMOVE,
        payload,
        meta: { ...meta }
      }
    }
  },

  photos: {
    add(payload, meta) {
      return {
        type: ITEM.PHOTO.ADD,
        payload,
        meta: { ...meta }
      }
    },

    remove(payload, meta) {
      return {
        type: ITEM.PHOTO.REMOVE,
        payload,
        meta: { ...meta }
      }
    }
  },

  notes: {
    add(payload, meta) {
      return {
        type: ITEM.NOTE.ADD,
        payload,
        meta: { ...meta }
      }
    },

    remove(payload, meta) {
      return {
        type: ITEM.NOTE.REMOVE,
        payload,
        meta: { ...meta }
      }
    }
  }
}
