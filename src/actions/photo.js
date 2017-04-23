'use strict'

const { PHOTO } = require('../constants')

module.exports = {
  create(payload, meta) {
    return {
      type: PHOTO.CREATE,
      payload,
      meta: { async: true, history: 'add', ...meta }
    }
  },

  delete(payload, meta) {
    return {
      type: PHOTO.DELETE,
      payload,
      meta: { async: true, history: 'add', ...meta }
    }
  },

  restore(payload, meta) {
    return {
      type: PHOTO.RESTORE,
      payload,
      meta: { async: true, history: 'add', ...meta }
    }
  },

  load(payload, meta) {
    return {
      type: PHOTO.LOAD,
      payload,
      meta: { async: true, ...meta }
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
      meta: { ...meta }
    }
  },

  move(payload, meta) {
    return {
      type: PHOTO.MOVE,
      payload,
      meta: { async: true, history: 'add', ...meta }
    }
  },

  order(payload, meta) {
    return {
      type: PHOTO.ORDER,
      payload,
      meta: { async: true, history: 'add', ...meta }
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
