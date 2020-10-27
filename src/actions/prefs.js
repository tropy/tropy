import { PREFS } from '../constants'

export default {
  close(payload, meta = {}) {
    return { type: PREFS.CLOSE, payload, meta }
  },

  restore(payload, meta = {}) {
    return { type: PREFS.RESTORE, payload, meta }
  },

  update(payload, meta = {}) {
    return { type: PREFS.UPDATE, payload, meta }
  }
}
