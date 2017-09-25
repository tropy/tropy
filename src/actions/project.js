'use strict'

const { PROJECT } =  require('../constants')


module.exports = {
  create(payload, meta) {
    return {
      type: PROJECT.CREATE,
      payload,
      meta: { ipc: true, ...meta }
    }
  },

  opened(payload, meta) {
    return {
      type: PROJECT.OPENED,
      error: (payload instanceof Error),
      payload,
      meta: { ipc: true, ...meta }
    }
  },

  open(payload, meta) {
    return { type: PROJECT.OPEN, payload, meta }
  },

  closed(payload, meta) {
    return { type: PROJECT.CLOSED, payload, meta }
  },

  close(payload, meta) {
    return {
      type: PROJECT.CLOSE,
      payload,
      meta,
      error: payload instanceof Error
    }
  },

  save(payload, meta) {
    return {
      type: PROJECT.SAVE,
      payload,
      meta: {
        cmd: 'project',
        history: 'add',
        ...meta
      }
    }
  },

  update(payload, meta) {
    return {
      type: PROJECT.UPDATE,
      payload,
      meta: { ipc: true, ...meta }
    }
  }

}
