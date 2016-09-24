'use strict'

const sequence = (k = 1) => () => (
  (k = Number.isSafeInteger(k) ? ++k : -k), k
)

module.exports = {
  seq() {
    const inc = sequence()
    return next => action => {
      action.meta = { ...action.meta, seq: inc() }
      return next(action)
    }
  }
}
