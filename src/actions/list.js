'use strict'

const {
  CREATE, TRANSIENT
} = require('../constants/list')


module.exports = {
  create(payload, meta) {
    return {
      type: CREATE,
      payload: { id: TRANSIENT, ...payload },
      meta
    }
  }
}
