'use strict'

const { handleActions: handle } = require('redux-actions')
const { UPDATE } = require('../constants/project')

module.exports = {
  project: handle({
    [UPDATE]: (state, { payload }) => ({
      ...state, ...payload
    })
  }, { name: '' })
}
