'use strict'

const init = {
  defaultLocale: 'en'
}

module.exports = {
  intl(state = init, action) {
    switch (action.type) {
      case 'intl:update':
        return { ...state, ...action.payload }

      default:
        return state
    }
  }
}
