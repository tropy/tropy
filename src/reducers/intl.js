'use strict'

module.exports = {
  intl(state = {
    locale: ARGS.locale,
    defaultLocale: 'en'
  }, action) {
    switch (action.type) {
      case 'intl:update':
        return { ...state, ...action.payload }

      default:
        return state
    }
  }
}
