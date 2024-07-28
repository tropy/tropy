import { PANEL } from '../constants/index.js'

export default {
  restore(payload = {}, meta = {}) {
    return {
      type: PANEL.RESTORE,
      payload,
      meta
    }
  },

  update(payload = {}, meta = {}) {
    return {
      type: PANEL.UPDATE,
      payload,
      meta
    }
  }
}
