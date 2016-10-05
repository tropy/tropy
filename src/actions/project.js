'use strict'

const {
  OPEN, OPENED, SAVE, UPDATE
} = require('../constants/project')

const { EDIT } = require('../constants/ui')


module.exports = {

  opened(payload, meta) {
    return {
      type: OPENED,
      error: (payload instanceof Error),
      payload,
      meta: { ipc: true, ...meta }
    }
  },

  open(payload, meta) {
    return { type: OPEN, payload, meta }
  },

  save(payload, meta) {
    return {
      type: SAVE,
      payload,
      meta: {
        async: true,
        record: true,
        ...meta
      }
    }
  },

  update(payload, meta) {
    return { type: UPDATE, payload, meta }
  },

  edit(payload, meta) {
    return {
      type: EDIT.START,
      payload: {
        project: { ...payload }
      },
      meta
    }
  }

}
