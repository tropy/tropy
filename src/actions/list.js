'use strict'

const {
  CREATE, REMOVE, PERSIST, UPDATE
} = require('../constants/list')

let tseq = 0

module.exports = {
  create(payload, meta) {
    return {
      type: CREATE,
      payload: {
        id: `transient-${++tseq}`,
        ...payload
      },
      meta
    }
  },

  remove(payload, meta) {
    return { type: REMOVE, payload, meta }
  },

  persist(payload, meta) {
    return { type: PERSIST, payload, meta: { persist: true, ...meta } }
  },

  update(payload, meta) {
    return { type: UPDATE, payload, meta }
  }
}
