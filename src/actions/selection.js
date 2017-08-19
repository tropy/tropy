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

  delete(payload, meta) {
    return {
      type: SELECTION.DELETE,
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
  },

  order(payload, meta) {
    return {
      type: SELECTION.ORDER,
      payload,
      meta: {
        cmd: 'project',
        history: 'merge',
        ...meta
      }
    }
  },

  restore(payload, meta) {
    return {
      type: SELECTION.RESTORE,
      payload,
      meta: {
        cmd: 'project',
        history: 'add',
        ...meta
      }
    }
  }
}
