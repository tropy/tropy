import { KeyMap } from '../common/res'
import { KEYMAP } from '../constants'
import { compile } from '../keymap'

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
