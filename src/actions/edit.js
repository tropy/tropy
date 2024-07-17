import { EDIT } from '../constants/index.js'

export default {
  cancel(payload, meta) {
    return {
      type: EDIT.CANCEL,
      payload,
      meta
    }
  },

  start(payload, meta) {
    return {
      type: EDIT.START,
      payload,
      meta
    }
  }
}
