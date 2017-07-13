'use strict'

const { STORAGE } = require('../constants')

module.exports = {
  reload(payload, meta = {}) {
    return { type: STORAGE.RELOAD, payload, meta }
  }
}
