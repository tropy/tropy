'use strict'

const {
  CREATE, REMOVE, SAVE, UPDATE
} = require('../constants/list')

let tseq = 0

module.exports = {
  create(payload, meta) {
    return {
      type: CREATE,
      payload: {
        id: `transient-${++tseq}`,
        ...payload,
        transient: true
      },
      meta
    }
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
