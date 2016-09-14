'use strict'

const {
  NEW, CREATE, INSERT, REMOVE, SAVE, UPDATE
} = require('../constants/list')

let tseq = 0

module.exports = {

  new(payload, meta) {
    return {
      type: NEW,
      payload: {
        id: `t${++tseq}`,
        ...payload,
        tmp: true
      },
      meta
    }
  },

  drop(payload, meta) {
    return { type: CREATE, payload, meta }
  },

  create(payload, meta) {
    return { type: CREATE, payload, meta }
  },

  insert(payload, meta) {
    return { type: INSERT, payload, meta }
  },

  remove(payload, meta) {
    return { type: REMOVE, payload, meta }
  },

  save(payload, meta) {
    return { type: SAVE, payload, meta: { persist: true, ...meta } }
  },

  update(payload, meta) {
    return { type: UPDATE, payload, meta }
  }
}
