'use strict'

const { Strings } = require('../common/res')

function getMessages() {
  return (dispatch, getState) => {
    const { intl: { locale, defaultLocale } } = getState()

    return Strings
      .open(locale)

      .catch({ code: 'ENOENT' }, () =>
          Strings.open(defaultLocale))

      .then(strings => strings.flatten())
      .tap(messages => dispatch(update({ messages })))
  }
}

function update(payload) {
  return {
    type: 'intl:update',
    payload
  }
}

module.exports = {
  getMessages,
  update
}
