'use strict'

module.exports = {
  seq(k = 1) {
    function inc() {
      return (k = Number.isSafeInteger(k) ? ++k : -k), k
    }

    return next => action => {
      action.meta = { ...action.meta, seq: inc() }
      return next(action)
    }
  }
}
