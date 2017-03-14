'use strict'

const { KeyMap } = require('../common/res')
const { KEYMAP } = require('../constants')
const { compile } = require('../keymap')

function load({ name, locale }) {
  return async function (dispatch) {
    const res = await KeyMap.openWithFallback('en', locale, name)
    const map = compile(res.map)

    dispatch(update(map))

    return map
  }
}

function update(payload, meta) {
  return {
    type: KEYMAP.UPDATE,
    payload,
    meta
  }
}

module.exports = {
  load,
  update
}
