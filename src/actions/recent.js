import { RECENT } from '../constants'

export default {
  restore(payload, meta = {}) {
    return {
      type: RECENT.RESTORE,
      payload,
      meta
    }
  }
}
