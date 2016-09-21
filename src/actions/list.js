'use strict'

const {
  NEW, CREATE, INSERT, REMOVE, LOAD, SAVE, UPDATE
} = require('../constants/list')

let tseq = 0

module.exports = {

  new(payload, meta) {
    return {
      type: NEW,
      payload: {
        id: `t${++tseq}`,
        name: '',
        parent: 0,
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
    return { type: CREATE, payload, meta: { ...meta, persist: true } }
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

  load(payload, meta) {
    return { type: LOAD, payload, meta: { retrieve: true, ...meta } }
  },

  update(payload, meta) {
    return { type: UPDATE, payload, meta }
  }
}
