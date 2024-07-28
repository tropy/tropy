import { ESPER } from '../constants/index.js'

export default {
  restore(payload = {}, meta = {}) {
    return {
      type: ESPER.RESTORE,
      payload,
      meta
    }
  },

  update(payload = {}, meta = {}) {
    return {
      type: ESPER.UPDATE,
      payload,
      meta: { throttle: true, log: 'trace', ...meta }
    }
  }
}
