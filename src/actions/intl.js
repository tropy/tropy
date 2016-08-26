'use strict'

const { createAction: action } = require('redux-actions')
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

const update = action(UPDATE)

module.exports = {
  getMessages,
  update
}
