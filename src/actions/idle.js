import { IDLE } from '../constants'

export default {
  active(payload, meta = {}) {
    return {
      type: IDLE.ACTIVE,
      payload,
      meta
    }
  },

  idle(payload, meta = {}) {
    return {
      type: IDLE.IDLE,
      payload,
      meta
    }
  }
}
