'use strict'

const { EDIT } = require('../constants/ui')

const edit = {
  cancel(payload, meta) {
    return { type: EDIT.CANCEL, payload, meta }
  }
}

module.exports = {
  edit
}
