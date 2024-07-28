import { RECENT } from '../constants/index.js'

export default {
  restore(payload, meta = {}) {
    return {
      type: RECENT.RESTORE,
      payload,
      meta
    }
  }
}
