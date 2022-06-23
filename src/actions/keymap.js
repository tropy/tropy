import { KeyMap } from '../res.js'
import { KEYMAP } from '../constants/index.js'
import { compile } from '../keymap.js'

function load({ locale }) {
  return async function (dispatch) {
    let res = await KeyMap.openWithFallback('en', locale)
    let map = compile(res.map)

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

export default {
  load,
  update
}
