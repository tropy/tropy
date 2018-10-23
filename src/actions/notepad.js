'use strict'

const { NOTEPAD } = require('../constants')

module.exports = {
  restore(payload = {}, meta = {}) {
    return {
      type: NOTEPAD.RESTORE,
      payload,
      meta
    }
  },

  update(payload = {}, meta = {}) {
    return {
      type: NOTEPAD.UPDATE,
      payload,
      meta: { throttle: true, ...meta }
    }
  }
}
