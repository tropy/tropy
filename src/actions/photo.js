'use strict'

const { PHOTO } = require('../constants')
const { array } = require('../common/util')

module.exports = {
  consolidate(payload, meta) {
    return {
      type: PHOTO.CONSOLIDATE,
      payload: array(payload),
      meta: { cmd: 'project', ...meta }
    }
  },

  contract(payload, meta = {}) {
    return {
      type: PHOTO.CONTRACT, payload, meta
    }
  },

  create(payload, meta) {
    return {
      type: PHOTO.CREATE,
      payload,
      meta: { cmd: 'project', history: 'add', ...meta }
    }
  },

  delete(payload, meta) {
    return {
      type: PHOTO.DELETE,
      payload,
      meta: { cmd: 'project', history: 'add', ...meta }
    }
  },

  error(payload, meta = {}) {
    return module.exports.update({ id: payload, broken: true }, meta)
  },

  expand(payload, meta = {}) {
    return {
      type: PHOTO.EXPAND, payload, meta
    }
  },

  update(payload, meta = {}) {
    return {
      type: PHOTO.UPDATE,
      payload,
      meta
    }
  },

  restore(payload, meta) {
    return {
      type: PHOTO.RESTORE,
      payload,
      meta: { cmd: 'project', history: 'add', ...meta }
    }
  },

  save(payload, meta) {
    return {
      type: PHOTO.SAVE,
      payload,
      meta: { cmd: 'project', history: 'merge', ...meta }
    }
  },

  load(payload, meta) {
    return {
      type: PHOTO.LOAD,
      payload,
      meta: { cmd: 'project', ...meta }
    }
  },

  insert(payload, meta) {
    return {
      type: PHOTO.INSERT,
      payload,
      meta: { ...meta }
    }
  },

  select(payload, meta) {
    return {
      type: PHOTO.SELECT,
      payload,
      meta: { log: 'trace', ...meta }
    }
  },

  move(payload, meta) {
    return {
      type: PHOTO.MOVE,
      payload,
      meta: { cmd: 'project', history: 'add', ...meta }
    }
  },

  order(payload, meta) {
    return {
      type: PHOTO.ORDER,
      payload,
      meta: { cmd: 'project', history: 'merge', ...meta }
    }
  },

  notes: {
    add(payload, meta) {
      return {
        type: PHOTO.NOTE.ADD,
        payload,
        meta: { ...meta }
      }
    },

    remove(payload, meta) {
      return {
        type: PHOTO.NOTE.REMOVE,
        payload,
        meta: { ...meta }
      }
    }
  },

  selections: {
    add(payload, meta) {
      return {
        type: PHOTO.SELECTION.ADD,
        payload,
        meta: { ...meta }
      }
    },

    remove(payload, meta) {
      return {
        type: PHOTO.SELECTION.REMOVE,
        payload,
        meta: { ...meta }
      }
    }
  },

  bulk: {
    update(payload, meta) {
      return {
        type: PHOTO.BULK.UPDATE,
        payload,
        meta: { ...meta }
      }
    }
  }
}
