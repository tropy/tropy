'use strict'

const { Strings } = require('../common/res')
const { UPDATE } = require('../constants/intl')

function getMessages() {
  return (dispatch, getState) => {
    const { intl: { locale, defaultLocale } } = getState()

    return Strings
      .open(locale)

      .catch({ code: 'ENOENT' }, () =>
          Strings.open(defaultLocale))

      .then(strings => strings.flatten())
      .tap(messages => dispatch(update({ locale, messages })))
  }
}

function update(payload) {
  return { type: UPDATE, payload }
}

module.exports = {
  getMessages,
  update
}
