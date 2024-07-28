import { SIDEBAR } from '../constants/index.js'

export default {
  restore(payload = {}, meta = {}) {
    return {
      type: SIDEBAR.RESTORE,
      payload,
      meta
    }
  },

  update(payload = {}, meta = {}) {
    return {
      type: SIDEBAR.UPDATE,
      payload,
      meta: { throttle: true, log: 'trace', ...meta }
    }
  }
}
