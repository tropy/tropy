import { IDLE } from '../constants/index.js'

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
