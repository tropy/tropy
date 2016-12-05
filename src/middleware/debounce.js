'use strict'

const debounce = require('lodash.debounce')

const middleware = () => next => {
  const dnxt = debounce(next, 75)

  return action => {
    const { meta = {} } = action

    return (meta.debounce) ?
      dnxt(action) :
      next(action)
  }
}

module.exports = {
  debounce: middleware
}
