import { PANEL } from '../constants'

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
