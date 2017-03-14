'use strict'

const { Strings } = require('../common/res')
const { UPDATE } = require('../constants/intl')

function load({ locale }) {
  return async function (dispatch) {
    const strings = await Strings.openWithFallback('en', locale)
    const messages = strings.flatten()

    dispatch(update({ locale, messages }))

    return messages
  }
}

function update(payload, meta) {
  return {
    type: UPDATE,
    payload,
    meta
  }
}

module.exports = {
  load,
  update
}
