'use strict'

const { ESPER } = require('../constants')

module.exports = {
  restore(payload = {}, meta = {}) {
    return {
      type: ESPER.RESTORE,
      payload,
      meta
    }
  },

  update(payload = {}, meta = {}) {
    return {
      type: ESPER.UPDATE,
      payload,
      meta: { throttle: true, log: 'silly', ...meta }
    }
  }
}
