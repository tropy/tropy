'use strict'

const {
  LOAD
} = require('../constants/metadata')

module.exports = {
  load(payload, meta) {
    return {
      type: LOAD,
      payload,
      meta: { async: true, ...meta }
    }
  }
}
