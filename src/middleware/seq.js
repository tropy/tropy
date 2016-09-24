'use strict'

module.exports = {
  seq(k = 0) {
    function inc() {
      return (k = Number.isSafeInteger(k) ? ++k : 0), k
    }

    return next => action => {
      action.meta = { ...action.meta, seq: inc() }
      return next(action)
    }
  }
}
