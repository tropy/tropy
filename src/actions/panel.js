'use strict'

const { PANEL } = require('../constants')

module.exports = {
  restore(payload = {}, meta = {}) {
    return {
      type: PANEL.RESTORE,
      payload,
      meta
    }
  },

  update(payload = {}, meta = {}) {
    return {
      type: PANEL.UPDATE,
      payload,
      meta
    }
  }
}
