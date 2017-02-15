'use strict'

const throttle = require('lodash.throttle')

const middleware = () => next => {
  const tnxt = throttle(next, 75)

  return action => {
    const { meta } = action

    return (meta && meta.throttle) ?
      tnxt(action) :
      next(action)
  }
}

module.exports = {
  throttle: middleware
}
