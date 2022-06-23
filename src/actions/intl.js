import { INTL } from '../constants/index.js'
import { Strings } from '../res.js'

function load({ locale }) {
  return async function (dispatch) {
    let strings = await Strings.openWithFallback('en', locale)
    let messages = {
      ...strings.flatten(),
      dialog: strings.dict.dialog
    }

    dispatch(update({ locale, messages }))

    return messages
  }
}

function update(payload, meta) {
  return {
    type: INTL.UPDATE,
    payload,
    meta
  }
}

export default {
  load,
  update
}
