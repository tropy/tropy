'use strict'

module.exports = {
  locale({ intl }) {
    return intl.locale
  },

  message({ intl }, { id }) {
    return intl.messages[id]
  }
}
