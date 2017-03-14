'use strict'

const { Strings } = require('../common/res')
const { UPDATE } = require('../constants/intl')

function getMessages() {
  return async (dispatch, getState) => {
    const { intl: { locale, defaultLocale } } = getState()

    const strings = await Strings.openWithFallback(defaultLocale, locale)
    const messages = strings.flatten()

    dispatch(update({ locale, messages }))

    return messages
  }
}

function update(payload) {
  return { type: UPDATE, payload }
}

module.exports = {
  getMessages,
  update
}
