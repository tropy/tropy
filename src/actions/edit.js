import { EDIT } from '../constants'

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
