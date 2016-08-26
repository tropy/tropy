'use strict'

const { handleActions: handle } = require('redux-actions')
const { UPDATE } = require('../constants/intl')

module.exports = {
  intl: handle({
    [UPDATE]: (state, { payload }) => ({
      ...state, ...payload
    })
  }, {
    locale: ARGS.locale,
    defaultLocale: 'en'
  })
}
