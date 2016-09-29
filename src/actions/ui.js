'use strict'

const { EDITABLE } = require('../constants/ui')

const editable = {
  cancel(payload, meta) {
    return { type: EDITABLE.CANCEL, payload, meta }
  }
}

module.exports = {
  ui: {
    editable
  }
}
