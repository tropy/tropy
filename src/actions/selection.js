'use strict'

const { SELECTION } = require('../constants')

module.exports = {
  create(payload, meta) {
    return {
      type: SELECTION.CREATE,
      payload,
      meta: {
        cmd: 'project',
        history: 'add',
        ...meta
      }
    }
  },

  load(payload, meta) {
    return {
      type: SELECTION.LOAD,
      payload,
      meta: {
        cmd: 'project',
        ...meta
      }
    }
  }
}
