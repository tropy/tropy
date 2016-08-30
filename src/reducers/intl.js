'use strict'

const { UPDATE } = require('../constants/intl')

module.exports = {
  intl(state = {
    locale: ARGS.locale,
    defaultLocale: 'en'
  }, action) {
    switch (action.type) {

      case UPDATE:
        return { ...state, ...action.payload }

      default:
        return state
    }
  }
}
