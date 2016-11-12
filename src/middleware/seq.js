'use strict'

const { sequence } = require('../common/util')

module.exports = {
  seq() {
    const inc = sequence()

    return next => action => {
      action.meta = {
        ...action.meta,
        seq: inc(),
        now: Date.now()
      }

      return next(action)
    }
  }
}
