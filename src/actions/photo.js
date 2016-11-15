'use strict'

const { PHOTO } = require('../constants')

module.exports = {
  create(payload, meta) {
    return {
      type: PHOTO.CREATE,
      payload,
      meta: { async: true, record: true, ...meta }
    }
  },

  delete(payload, meta) {
    return {
      type: PHOTO.DELETE,
      payload,
      meta: { async: true, record: true, ...meta }
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

  select(payload, meta = {}) {
    return { type: PHOTO.SELECT, payload, meta }
  }
}
