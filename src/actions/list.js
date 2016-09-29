'use strict'

const {
  NEW, CREATE, INSERT, REMOVE, RESTORE, PRUNE, LOAD, SAVE, DELETE, EDIT, UPDATE
} = require('../constants/list')

let tseq = 0

module.exports = {

  new(payload, meta) {
    return {
      type: NEW,
      payload: {
        id: --tseq,
        name: '',
        parent: 0,
        ...payload,
        tmp: true
      },
      meta
    }
  },

  create(payload, meta) {
    return {
      type: CREATE,
      payload,
      meta: {
        cmd: true,
        history: true,
        ...meta
      }
    }
  },

  insert(payload, meta) {
    return { type: INSERT, payload, meta }
  },

  remove(payload, meta) {
    return { type: REMOVE, payload, meta }
  },

  save(payload, meta) {
    return { type: SAVE, payload, meta: { cmd: true, ...meta } }
  },

  delete(payload, meta) {
    return {
      type: DELETE,
      payload,
      meta: {
        cmd: true,
        history: true,
        ...meta
      }
    }
  },

  prune(payload, meta) {
    return { type: PRUNE, payload, meta: { cmd: true, ...meta } }
  },

  restore(payload, meta) {
    return { type: RESTORE, payload, meta: { cmd: true, ...meta } }
  },

  load(payload, meta) {
    return { type: LOAD, payload, meta: { cmd: true, ...meta } }
  },

  edit(payload, meta) {
    return { type: EDIT, payload, meta }
  },

  update(payload, meta) {
    return { type: UPDATE, payload, meta }
  }
}
