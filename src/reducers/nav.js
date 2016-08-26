'use strict'

const { handleActions: handle } = require('redux-actions')
const { UPDATE } = require('../constants/nav')

module.exports = {
  nav: handle({
    [UPDATE]: (state, { payload }) => ({
      ...state, ...payload
    })

  }, {})
}
