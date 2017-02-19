'use strict'

const { NOTE } = require('../constants')

module.exports = {
  create(payload, meta) {
    return {
      type: NOTE.CREATE,
      payload,
      meta: { async: true, record: true, ...meta }
    }
  },

  save(payload, meta) {
    return {
      type: NOTE.SAVE,
      payload,
      meta: { async: true, record: true, ...meta }
    }
  },

  load(payload, meta) {
    return {
      type: NOTE.LOAD,
      payload,
      meta: { ...meta }
    }
  },

  select(payload, meta) {
    return {
      type: NOTE.SELECT,
      payload,
      meta: { ...meta }
    }
  },

  update(payload, meta) {
    return {
      type: NOTE.UPDATE,
      payload,
      meta: { ...meta }
    }
  },

  delete(payload, meta) {
    return {
      type: NOTE.DELETE,
      payload,
      meta: { async: true, record: true, ...meta }
    }
  },

  restore(payload, meta) {
    return {
      type: NOTE.RESTORE,
      payload,
      meta: { async: true, record: true, ...meta }
    }
  }
}
